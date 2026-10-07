/**
 * Parses the Design stage's `schema.prisma` into a plain `DataModel`.
 *
 * This file has no imports on purpose: the template carries a verbatim copy into the generated app's
 * `scripts/lib/` so the parity gate and the factory read the contract with identical logic.
 * The target database is SQLite, so Prisma native types (`@db.*`) are rejected.
 */

/** Prisma scalar types the generated Drizzle/SQLite backend can represent. */
export const PRISMA_SCALARS = [
  "String",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "Boolean",
  "DateTime",
  "Json",
  "Bytes",
] as const;

export type PrismaScalar = (typeof PRISMA_SCALARS)[number];

export interface DataModelRelation {
  /** Scalar FK fields on this model; empty on the back-relation side. */
  fields: string[];
  /** Fields on the referenced model; empty on the back-relation side. */
  references: string[];
  /** Relation name, needed when two relations join the same pair of models. */
  name?: string;
  /** Referential action as written in the contract (`Cascade`, `SetNull`, ...). */
  onDelete?: string;
}

export interface DataModelField {
  name: string;
  /** Scalar type, enum name, or model name. */
  type: string;
  /** `scalar` and `enum` fields become columns; `relation` fields never do. */
  kind: "scalar" | "enum" | "relation";
  optional: boolean;
  list: boolean;
  isId: boolean;
  isUnique: boolean;
  /** `@updatedAt` — the backend sets it on every write. */
  isUpdatedAt: boolean;
  /** Raw text inside `@default(...)`, e.g. `uuid()`, `now()`, `TODO`, `0`. */
  default?: string;
  relation?: DataModelRelation;
}

export interface DataModelModel {
  name: string;
  fields: DataModelField[];
  /** Composite `@@unique([...])` constraints, each a list of field names. */
  uniques: string[][];
  /** Composite `@@id([...])`, when the model has one. */
  compositeId?: string[];
}

export interface DataModelEnum {
  name: string;
  values: string[];
}

export interface DataModel {
  models: DataModelModel[];
  enums: DataModelEnum[];
}

/**
 * Thrown when the schema cannot be used. `issues` lists every problem with its line number,
 * so Design can fix them in one pass.
 */
export class DataModelError extends Error {
  constructor(readonly issues: string[]) {
    super(`schema.prisma is invalid:\n- ${issues.join("\n- ")}`);
    this.name = "DataModelError";
  }
}

interface Attribute {
  name: string;
  args: string | undefined;
}

interface RawBlock {
  kind: string;
  name: string;
  line: number;
  body: { text: string; line: number }[];
}

const BLOCK_START = /^(model|enum|datasource|generator|view|type)\s+([A-Za-z_]\w*)\s*\{\s*$/;
const FIELD_LINE = /^([A-Za-z_]\w*)\s+([A-Za-z_]\w*(?:\([^)]*\))?)(\[\])?(\?)?(?:\s+(.*))?$/;

/**
 * Parses `schema.prisma` text.
 *
 * @returns the models (in file order) and enums.
 * @throws DataModelError listing every unsupported construct, unknown type or bad relation.
 */
export function parsePrismaSchema(source: string): DataModel {
  const issues: string[] = [];
  const blocks = splitBlocks(source, issues);
  const enums: DataModelEnum[] = [];
  const models: DataModelModel[] = [];

  for (const block of blocks) {
    if (block.kind === "enum") {
      enums.push({
        name: block.name,
        values: block.body.map((row) => row.text.split(/\s+/)[0]).filter((value) => !value.startsWith("@@")),
      });
    } else if (block.kind === "view" || block.kind === "type") {
      issues.push(`line ${block.line}: "${block.kind} ${block.name}" is not supported; use a model.`);
    }
  }

  const enumNames = new Set(enums.map((item) => item.name));
  const modelNames = new Set(blocks.filter((block) => block.kind === "model").map((block) => block.name));

  for (const block of blocks.filter((item) => item.kind === "model")) {
    models.push(parseModel(block, enumNames, modelNames, issues));
  }

  checkRelations(models, issues);
  if (issues.length > 0) {
    throw new DataModelError(issues);
  }
  return { models, enums };
}

function splitBlocks(source: string, issues: string[]): RawBlock[] {
  const blocks: RawBlock[] = [];
  let current: RawBlock | undefined;
  const lines = source.split(/\r?\n/);

  for (const [index, raw] of lines.entries()) {
    const line = index + 1;
    const text = stripComment(raw).trim();
    if (!text) {
      continue;
    }
    if (!current) {
      const start = text.match(BLOCK_START);
      if (start) {
        current = { kind: start[1], name: start[2], line, body: [] };
      } else {
        issues.push(`line ${line}: unexpected "${text}" outside a block.`);
      }
      continue;
    }
    if (text === "}") {
      blocks.push(current);
      current = undefined;
      continue;
    }
    current.body.push({ text, line });
  }

  if (current) {
    issues.push(`line ${current.line}: ${current.kind} ${current.name} is missing its closing "}".`);
  }
  return blocks;
}

function parseModel(
  block: RawBlock,
  enumNames: Set<string>,
  modelNames: Set<string>,
  issues: string[],
): DataModelModel {
  const model: DataModelModel = { name: block.name, fields: [], uniques: [] };

  for (const row of block.body) {
    const where = `line ${row.line} (${block.name})`;
    if (row.text.startsWith("@@")) {
      for (const attribute of parseAttributes(row.text, where, issues)) {
        if (attribute.name === "@@unique") {
          model.uniques.push(fieldList(attribute.args));
        } else if (attribute.name === "@@id") {
          model.compositeId = fieldList(attribute.args);
        }
      }
      continue;
    }

    const match = row.text.match(FIELD_LINE);
    if (!match) {
      issues.push(`${where}: cannot read field "${row.text}".`);
      continue;
    }
    const [, name, type, list, optional, rest] = match;
    const field: DataModelField = {
      name,
      type,
      kind: "scalar",
      optional: Boolean(optional),
      list: Boolean(list),
      isId: false,
      isUnique: false,
      isUpdatedAt: false,
    };

    if ((PRISMA_SCALARS as readonly string[]).includes(type)) {
      field.kind = "scalar";
    } else if (enumNames.has(type)) {
      field.kind = "enum";
    } else if (modelNames.has(type)) {
      field.kind = "relation";
    } else {
      issues.push(`${where}: field "${name}" has unknown type "${type}".`);
    }

    for (const attribute of parseAttributes(rest ?? "", `${where} field "${name}"`, issues)) {
      applyFieldAttribute(field, attribute, `${where} field "${name}"`, issues);
    }
    if (field.kind === "relation" && !field.relation) {
      field.relation = { fields: [], references: [] };
    }
    model.fields.push(field);
  }
  return model;
}

function applyFieldAttribute(
  field: DataModelField,
  attribute: Attribute,
  where: string,
  issues: string[],
): void {
  if (attribute.name.startsWith("@db.")) {
    issues.push(
      `${where}: native type ${attribute.name} is not supported; the target database is SQLite. Remove the @db attribute.`,
    );
    return;
  }
  switch (attribute.name) {
    case "@id":
      field.isId = true;
      return;
    case "@unique":
      field.isUnique = true;
      return;
    case "@updatedAt":
      field.isUpdatedAt = true;
      return;
    case "@default":
      field.default = attribute.args?.trim();
      return;
    case "@relation":
      field.relation = parseRelationArgs(attribute.args ?? "");
      return;
    case "@map":
    case "@ignore":
      // Column naming is owned by the drizzle-rules skill; these do not change the model's shape.
      return;
    default:
      issues.push(`${where}: attribute ${attribute.name} is not supported.`);
  }
}

function parseRelationArgs(args: string): DataModelRelation {
  const relation: DataModelRelation = { fields: [], references: [] };
  for (const part of splitTopLevel(args, ",")) {
    const pair = part.match(/^([A-Za-z]+)\s*:\s*([\s\S]+)$/);
    if (!pair) {
      const name = unquote(part);
      if (name) {
        relation.name = name;
      }
      continue;
    }
    const [, key, value] = pair;
    if (key === "fields") {
      relation.fields = fieldList(value);
    } else if (key === "references") {
      relation.references = fieldList(value);
    } else if (key === "name") {
      relation.name = unquote(value);
    } else if (key === "onDelete") {
      relation.onDelete = value.trim();
    }
  }
  return relation;
}

/** Relation `fields` must be scalars on the model; `references` must exist on the target. */
function checkRelations(models: DataModelModel[], issues: string[]): void {
  const byName = new Map(models.map((model) => [model.name, model]));
  for (const model of models) {
    const own = new Map(model.fields.map((field) => [field.name, field]));
    for (const field of model.fields) {
      const relation = field.relation;
      if (!relation || relation.fields.length === 0) {
        continue;
      }
      for (const name of relation.fields) {
        const fk = own.get(name);
        if (!fk || fk.kind === "relation") {
          issues.push(`${model.name}.${field.name}: relation field "${name}" is not a scalar field of ${model.name}.`);
        }
      }
      const target = byName.get(field.type);
      for (const name of relation.references) {
        if (target && !target.fields.some((item) => item.name === name)) {
          issues.push(`${model.name}.${field.name}: references "${name}", which ${field.type} does not have.`);
        }
      }
      if (relation.fields.length !== relation.references.length) {
        issues.push(`${model.name}.${field.name}: fields and references must have the same length.`);
      }
    }
    for (const unique of model.uniques) {
      for (const name of unique) {
        if (!own.has(name)) {
          issues.push(`${model.name}: @@unique names unknown field "${name}".`);
        }
      }
    }
  }
}

function parseAttributes(text: string, where: string, issues: string[]): Attribute[] {
  const attributes: Attribute[] = [];
  let index = 0;
  while (index < text.length) {
    if (/\s/.test(text[index])) {
      index += 1;
      continue;
    }
    if (text[index] !== "@") {
      issues.push(`${where}: cannot read "${text.slice(index)}".`);
      break;
    }
    const name = text.slice(index).match(/^@@?[A-Za-z_][\w.]*/)?.[0] ?? "@";
    index += name.length;
    let args: string | undefined;
    if (text[index] === "(") {
      const end = closingParen(text, index);
      if (end < 0) {
        issues.push(`${where}: unbalanced parentheses in ${name}.`);
        break;
      }
      args = text.slice(index + 1, end);
      index = end + 1;
    }
    attributes.push({ name, args });
  }
  return attributes;
}

/** Index of the `)` matching the `(` at `open`, skipping quoted strings; -1 when unbalanced. */
function closingParen(text: string, open: number): number {
  let depth = 0;
  let quote: string | undefined;
  for (let index = open; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === "\\") {
        index += 1;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(" || char === "[") {
      depth += 1;
    } else if (char === ")" || char === "]") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | undefined;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === quote) {
        quote = undefined;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(" || char === "[") {
      depth += 1;
    } else if (char === ")" || char === "]") {
      depth -= 1;
    } else if (char === separator && depth === 0) {
      parts.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts.filter(Boolean);
}

/** `[a, b]` or `fields: [a, b]` → `["a", "b"]`. */
function fieldList(args: string | undefined): string[] {
  const inner = args?.match(/\[([^\]]*)\]/)?.[1] ?? "";
  return inner
    .split(",")
    .map((item) => item.trim().split(/[\s(]/)[0])
    .filter(Boolean);
}

function unquote(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

/** Drops `//` and `///` comments, keeping `//` that sits inside a quoted string. */
function stripComment(line: string): string {
  let quote: string | undefined;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (char === "\\") {
        index += 1;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }
    if (char === '"') {
      quote = char;
    } else if (char === "/" && line[index + 1] === "/") {
      return line.slice(0, index);
    }
  }
  return line;
}

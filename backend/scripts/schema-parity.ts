/**
 * `npm run parity`: proves `src/db/schema.ts` implements `contract/schema.prisma`.
 *
 * Checks, per Prisma model: the table exists (model name → snake_case plural), every scalar or
 * enum field exists as a property with a compatible column type, and nullability, primary key,
 * uniqueness (single and composite), enum values and foreign keys (with onDelete) match.
 * Tables the contract does not define are mismatches too.
 *
 * Prints `{ ok, tables, mismatches }` as JSON; exits 1 on any mismatch.
 */
import { getTableColumns, is } from "drizzle-orm";
import { getTableConfig, SQLiteTable } from "drizzle-orm/sqlite-core";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as schema from "../src/db/schema";
import { type DataModelField, type DataModelModel, parsePrismaSchema } from "./lib/data-model";

type Column = ReturnType<typeof getTableColumns>[string] & {
  columnType: string;
  enumValues?: string[];
  isUnique: boolean;
  primary: boolean;
  notNull: boolean;
};

/** Drizzle column types that can store each Prisma scalar (see skill: drizzle-rules). */
const COMPATIBLE: Record<string, string[]> = {
  String: ["SQLiteText"],
  Int: ["SQLiteInteger"],
  BigInt: ["SQLiteBigInt", "SQLiteInteger"],
  Float: ["SQLiteReal", "SQLiteNumeric"],
  Decimal: ["SQLiteNumeric", "SQLiteReal", "SQLiteText"],
  Boolean: ["SQLiteBoolean"],
  DateTime: ["SQLiteTimestamp"],
  Json: ["SQLiteTextJson", "SQLiteBlobJson"],
  Bytes: ["SQLiteBlobBuffer"],
};
const LIST_TYPES = ["SQLiteTextJson", "SQLiteBlobJson"];
const ON_DELETE: Record<string, string> = {
  Cascade: "cascade",
  SetNull: "set null",
  Restrict: "restrict",
  NoAction: "no action",
  SetDefault: "set default",
};

/** `TaskStatus` → `task_statuses`, `Company` → `companies`, `Membership` → `memberships`. */
export function tableNameFor(model: string): string {
  const snake = model.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  if (/[^aeiou]y$/.test(snake)) {
    return `${snake.slice(0, -1)}ies`;
  }
  if (/(s|x|z|ch|sh)$/.test(snake)) {
    return `${snake}es`;
  }
  return `${snake}s`;
}

const dataModel = parsePrismaSchema(readFileSync(join(process.cwd(), "contract", "schema.prisma"), "utf8"));
const tables = Object.values(schema as Record<string, unknown>).filter((value): value is SQLiteTable =>
  is(value, SQLiteTable),
);
const byName = new Map(tables.map((table) => [getTableConfig(table).name, table]));
const mismatches: string[] = [];

for (const model of dataModel.models) {
  const expected = tableNameFor(model.name);
  const table = byName.get(expected);
  if (!table) {
    mismatches.push(`${model.name}: table "${expected}" is missing from src/db/schema.ts.`);
    continue;
  }
  checkModel(model, table);
}
const expectedNames = new Set(dataModel.models.map((model) => tableNameFor(model.name)));
for (const name of byName.keys()) {
  if (!expectedNames.has(name)) {
    mismatches.push(`table "${name}" is not defined by contract/schema.prisma.`);
  }
}

function checkModel(model: DataModelModel, table: SQLiteTable): void {
  const columns = getTableColumns(table) as Record<string, Column>;
  const config = getTableConfig(table);
  const tableName = config.name;

  for (const field of model.fields.filter((item) => item.kind !== "relation")) {
    const where = `${model.name}.${field.name}`;
    const column = columns[field.name];
    if (!column) {
      mismatches.push(`${where}: property "${field.name}" is missing on table "${tableName}".`);
      continue;
    }
    checkType(where, field, column);
    const isPrimary = column.primary || config.primaryKeys.some((pk) => pk.columns.length === 1 && pk.columns[0] === column);
    if (field.isId !== isPrimary) {
      mismatches.push(`${where}: ${field.isId ? "must be" : "must not be"} the primary key.`);
    }
    if (!field.isId && field.optional === column.notNull) {
      mismatches.push(`${where}: must be ${field.optional ? "nullable" : ".notNull()"}.`);
    }
    if (field.isUnique && !isPrimary && !uniqueOn(config, [column.name], column)) {
      mismatches.push(`${where}: must be unique.`);
    }
  }

  for (const fields of model.uniques) {
    const names = fields.map((name) => columns[name]?.name).filter((name): name is string => Boolean(name));
    if (names.length !== fields.length || !uniqueOn(config, names)) {
      mismatches.push(`${model.name}: composite unique (${fields.join(", ")}) is missing.`);
    }
  }
  if (model.compositeId) {
    const names = model.compositeId.map((name) => columns[name]?.name);
    const found = config.primaryKeys.some((pk) => sameSet(pk.columns.map((column) => column.name), names));
    if (!found) {
      mismatches.push(`${model.name}: composite primary key (${model.compositeId.join(", ")}) is missing.`);
    }
  }

  for (const field of model.fields.filter((item) => item.kind === "relation" && item.relation?.fields.length)) {
    const relation = field.relation!;
    const where = `${model.name}.${field.name}`;
    const localNames = relation.fields.map((name) => columns[name]?.name);
    const targetTable = tableNameFor(field.type);
    const fk = config.foreignKeys.find((item) => {
      const reference = item.reference();
      return (
        getTableConfig(reference.foreignTable).name === targetTable &&
        sameSet(reference.columns.map((column) => column.name), localNames)
      );
    });
    if (!fk) {
      mismatches.push(`${where}: foreign key (${relation.fields.join(", ")}) → ${targetTable} is missing.`);
      continue;
    }
    const expected = relation.onDelete ? ON_DELETE[relation.onDelete] : undefined;
    if (expected && fk.onDelete !== expected) {
      mismatches.push(`${where}: onDelete must be "${expected}", found "${fk.onDelete ?? "no action"}".`);
    }
  }
}

function checkType(where: string, field: DataModelField, column: Column): void {
  if (field.list) {
    if (!LIST_TYPES.includes(column.columnType)) {
      mismatches.push(`${where}: list fields need a JSON column (text({ mode: "json" })), found ${column.columnType}.`);
    }
    return;
  }
  if (field.kind === "enum") {
    const values = dataModel.enums.find((item) => item.name === field.type)?.values ?? [];
    if (column.columnType !== "SQLiteText" || !sameSet(column.enumValues ?? [], values)) {
      mismatches.push(`${where}: must be text({ enum: [${values.map((value) => `"${value}"`).join(", ")}] }).`);
    }
    return;
  }
  const allowed = COMPATIBLE[field.type] ?? [];
  if (!allowed.includes(column.columnType)) {
    mismatches.push(`${where}: ${field.type} needs ${allowed.join(" or ")}, found ${column.columnType}.`);
  }
}

function uniqueOn(config: ReturnType<typeof getTableConfig>, names: string[], column?: Column): boolean {
  if (column?.isUnique) {
    return true;
  }
  const indexed = config.indexes.some(
    (index) =>
      index.config.unique &&
      sameSet(
        index.config.columns.map((item) => ("name" in item ? String(item.name) : "")),
        names,
      ),
  );
  const constrained = config.uniqueConstraints.some((item) => sameSet(item.columns.map((col) => col.name), names));
  return indexed || constrained;
}

function sameSet(a: readonly (string | undefined)[], b: readonly (string | undefined)[]): boolean {
  return a.length === b.length && a.every((item) => b.includes(item));
}

const ok = mismatches.length === 0;
console.log(
  JSON.stringify(
    { ok, tables: { expected: [...expectedNames], found: [...byName.keys()] }, mismatches },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);

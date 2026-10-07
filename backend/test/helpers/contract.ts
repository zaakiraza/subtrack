/**
 * `expectMatchesContract(res, operationId)`: validates a response's status and body against the
 * schema that `contract/openapi.yaml` documents for that operation and status.
 *
 * Response-level `$ref`s are resolved here; schema `$ref`s (`#/components/schemas/...`) are
 * rewritten to point into the whole document registered with ajv, so shared schemas resolve.
 */
import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

type Json = Record<string, unknown>;

interface Contract {
  doc: Json;
  ajv: Ajv;
  operations: Map<string, Json>;
  validators: Map<string, ValidateFunction>;
}

const DOC_ID = "openapi.json";
const METHODS = new Set(["get", "put", "post", "delete", "patch", "options", "head", "trace"]);
let contract: Contract | undefined;

export interface ContractResponse {
  status: number;
  body: unknown;
  text?: string;
}

/** Throws a descriptive error when the status is undocumented or the body breaks the schema. */
export function expectMatchesContract(res: ContractResponse, operationId: string): void {
  const { doc, ajv, operations, validators } = load();
  const operation = operations.get(operationId);
  if (!operation) {
    throw new Error(`Unknown operationId "${operationId}" in contract/openapi.yaml.`);
  }
  const responses = (operation.responses ?? {}) as Json;
  const status = String(res.status);
  const key = [status, `${status[0]}XX`, "default"].find((candidate) => candidate in responses);
  if (!key) {
    throw new Error(
      `${operationId}: status ${status} is not documented (documented: ${Object.keys(responses).join(", ")}). ` +
        `Body: ${snippet(res)}`,
    );
  }

  const response = deref(doc, responses[key]);
  const schema = ((response.content as Json | undefined)?.["application/json"] as Json | undefined)?.schema;
  if (!schema) {
    if (res.text) {
      throw new Error(`${operationId} ${status}: the contract documents no body, but one was returned: ${snippet(res)}`);
    }
    return;
  }

  const cacheKey = `${operationId} ${key}`;
  let validate = validators.get(cacheKey);
  if (!validate) {
    validate = ajv.compile(rewriteRefs(schema) as Json);
    validators.set(cacheKey, validate);
  }
  if (!validate(res.body)) {
    throw new Error(
      `${operationId} ${status} response does not match the contract: ` +
        `${ajv.errorsText(validate.errors, { dataVar: "body" })}. Body: ${snippet(res)}`,
    );
  }
}

function load(): Contract {
  if (contract) {
    return contract;
  }
  const doc = parse(readFileSync(join(process.cwd(), "contract", "openapi.yaml"), "utf8")) as Json;
  // strict: false — OpenAPI adds keywords (example, xml, discriminator, x-*) that are not JSON Schema.
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(doc, DOC_ID);

  const operations = new Map<string, Json>();
  for (const item of Object.values((doc.paths ?? {}) as Record<string, Json>)) {
    for (const [method, operation] of Object.entries(item)) {
      if (METHODS.has(method) && typeof (operation as Json).operationId === "string") {
        operations.set((operation as Json).operationId as string, operation as Json);
      }
    }
  }
  contract = { doc, ajv, operations, validators: new Map() };
  return contract;
}

/** Follows `{ $ref: "#/components/responses/X" }` chains inside the document. */
function deref(doc: Json, value: unknown, depth = 0): Json {
  const node = value as Json;
  if (depth > 10 || typeof node?.$ref !== "string" || !node.$ref.startsWith("#/")) {
    return node;
  }
  const target = node.$ref
    .slice(2)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((current, part) => (current as Json | undefined)?.[part], doc);
  return deref(doc, target, depth + 1);
}

function rewriteRefs(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(rewriteRefs);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        key === "$ref" && typeof child === "string" && child.startsWith("#") ? `${DOC_ID}${child}` : rewriteRefs(child),
      ]),
    );
  }
  return value;
}

function snippet(res: ContractResponse): string {
  return (res.text ?? JSON.stringify(res.body) ?? "").slice(0, 300);
}

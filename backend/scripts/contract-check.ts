/**
 * `npm run contract`: compares the routes AppModule serves with every operation in
 * `contract/openapi.yaml` (method + path, and handler name = operationId).
 *
 * Prints `{ ok, missing, extra, misnamed }` as JSON; exits 1 when anything is missing or misnamed.
 * `extra` (routes the contract does not list) is reported but does not fail the check.
 */
import "reflect-metadata";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { AppModule } from "../src/app.module";
import { collectRoutes } from "../src/common/route-inventory";

/** Routes the template itself provides; never "extra". */
const TEMPLATE_ROUTES = new Set(["GET /health"]);
const METHODS = ["get", "put", "post", "delete", "patch", "options", "head", "trace"];

interface ContractOperation {
  operationId: string;
  method: string;
  path: string;
}

function contractOperations(): ContractOperation[] {
  const doc = parse(readFileSync(join(process.cwd(), "contract", "openapi.yaml"), "utf8")) as {
    paths?: Record<string, Record<string, { operationId?: string }>>;
  };
  const operations: ContractOperation[] = [];
  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    for (const [method, operation] of Object.entries(item ?? {})) {
      if (METHODS.includes(method) && operation?.operationId) {
        operations.push({ operationId: operation.operationId, method: method.toUpperCase(), path });
      }
    }
  }
  return operations;
}

/** `/a/{id}/b` and `/a/:taskId/b/` compare equal: parameter names do not matter, only positions. */
function routeKey(method: string, path: string): string {
  const normalized = path.replace(/\{[^}]+\}|:[A-Za-z_]\w*/g, ":param").replace(/\/+$/, "") || "/";
  return `${method.toUpperCase()} ${normalized}`;
}

const routes = collectRoutes(AppModule);
const byKey = new Map(routes.map((route) => [routeKey(route.method, route.path), route]));
const operations = contractOperations();
const contractKeys = new Set(operations.map((operation) => routeKey(operation.method, operation.path)));

const missing: string[] = [];
const misnamed: string[] = [];
for (const operation of operations) {
  const route = byKey.get(routeKey(operation.method, operation.path));
  if (!route) {
    missing.push(`${operation.operationId} (${operation.method} ${operation.path})`);
  } else if (route.handlerName !== operation.operationId) {
    misnamed.push(
      `${operation.method} ${operation.path}: handler ${route.controller}.${route.handlerName} must be named "${operation.operationId}"`,
    );
  }
}
const extra = routes
  .filter((route) => !contractKeys.has(routeKey(route.method, route.path)))
  .map((route) => `${route.method} ${route.path}`)
  .filter((key) => !TEMPLATE_ROUTES.has(key));

const ok = missing.length === 0 && misnamed.length === 0;
console.log(JSON.stringify({ ok, total: operations.length, missing, extra, misnamed }, null, 2));
process.exit(ok ? 0 : 1);

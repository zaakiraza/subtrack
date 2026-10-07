/**
 * Lists every HTTP route the app serves by walking the module tree's decorator metadata.
 *
 * Static on purpose: the contract check runs under tsx, which does not emit decorator type
 * metadata, so booting the app (dependency injection) is not possible there. Route paths and
 * methods are plain metadata written by `@Controller`/`@Get`/... and need no instantiation.
 */
import { type DynamicModule, RequestMethod, type Type } from "@nestjs/common";
import { METHOD_METADATA, MODULE_METADATA, PATH_METADATA } from "@nestjs/common/constants";

export interface RouteInfo {
  method: string;
  /** Express-style path, e.g. `/workspaces/:workspaceId/projects`. */
  path: string;
  /** Controller method name; must equal the contract's operationId. */
  handlerName: string;
  controller: string;
}

type ModuleRef = Type<unknown> | DynamicModule | { forwardRef: () => Type<unknown> } | Promise<DynamicModule>;

export function collectRoutes(root: Type<unknown>): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const seenModules = new Set<unknown>();
  const seenControllers = new Set<unknown>();

  const visit = (ref: ModuleRef | undefined): void => {
    if (!ref || ref instanceof Promise) {
      return;
    }
    if ("forwardRef" in ref && typeof ref.forwardRef === "function") {
      visit(ref.forwardRef());
      return;
    }
    const dynamic = "module" in ref ? (ref as DynamicModule) : undefined;
    const moduleClass = dynamic ? dynamic.module : (ref as Type<unknown>);
    if (seenModules.has(ref)) {
      return;
    }
    seenModules.add(ref);

    const imports: ModuleRef[] = [
      ...(Reflect.getMetadata(MODULE_METADATA.IMPORTS, moduleClass) ?? []),
      ...(dynamic?.imports ?? []),
    ];
    const controllers: Type<unknown>[] = [
      ...(Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, moduleClass) ?? []),
      ...(dynamic?.controllers ?? []),
    ];
    for (const controller of controllers) {
      if (!seenControllers.has(controller)) {
        seenControllers.add(controller);
        routes.push(...controllerRoutes(controller));
      }
    }
    imports.forEach(visit);
  };

  visit(root);
  return routes;
}

function controllerRoutes(controller: Type<unknown>): RouteInfo[] {
  const prefixes = asList(Reflect.getMetadata(PATH_METADATA, controller));
  const prototype = controller.prototype as Record<string, unknown>;
  const routes: RouteInfo[] = [];
  for (const name of Object.getOwnPropertyNames(prototype)) {
    const handler = prototype[name];
    if (name === "constructor" || typeof handler !== "function") {
      continue;
    }
    const method: RequestMethod | undefined = Reflect.getMetadata(METHOD_METADATA, handler);
    if (method === undefined) {
      continue;
    }
    for (const prefix of prefixes) {
      for (const path of asList(Reflect.getMetadata(PATH_METADATA, handler))) {
        routes.push({ method: RequestMethod[method], path: joinPath(prefix, path), handlerName: name, controller: controller.name });
      }
    }
  }
  return routes;
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(String) : ["/"];
  }
  return [typeof value === "string" ? value : "/"];
}

function joinPath(...parts: string[]): string {
  const joined = parts.map((part) => part.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
  return `/${joined}`;
}

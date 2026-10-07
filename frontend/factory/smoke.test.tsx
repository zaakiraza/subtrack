// Written by AI Factory before every render; do not edit. Renders the app at each route and
// fails on runtime errors that tsc and vite build cannot see.
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { App } from "../src/App";

const ROUTES: string[] = ["/","/signin","/register","/forgot-password","/dashboard","/subscriptions/form","/subscriptions/delete-confirm","/admin/users","/forbidden"];

afterEach(cleanup);

/** React reports render errors through console.error; plain warnings (keys, act) are not failures. */
function isError(args: unknown[]): boolean {
  return args.some((arg) => arg instanceof Error) || /Error|Uncaught|above error/.test(args.map(String).join(" "));
}

it.each(ROUTES)("renders %s without runtime errors", async (route) => {
  const errors: string[] = [];
  const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (isError(args)) {
      errors.push(args.map((arg) => (arg instanceof Error ? arg.stack ?? arg.message : String(arg))).join(" "));
    }
  });
  const onError = (event: ErrorEvent) => {
    errors.push(String(event.error?.stack ?? event.message));
    event.preventDefault();
  };
  window.addEventListener("error", onError);
  try {
    const { container } = render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>,
    );
    // Effects and lazy state settle after the first paint.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(errors, `route ${route} threw:\n${errors.join("\n")}`).toEqual([]);
    expect(container.innerHTML.length, `route ${route} rendered nothing`).toBeGreaterThan(0);
  } finally {
    spy.mockRestore();
    window.removeEventListener("error", onError);
  }
});

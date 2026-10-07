/**
 * Account helpers for API tests. Defaults follow the common `/auth/register` + `/auth/login`
 * convention; every product-specific step can be replaced with a callback built from the contract.
 */
import type { Response } from "supertest";
import type { TestApp } from "./app";

export interface Credentials {
  name: string;
  email: string;
  password: string;
}

export interface Session extends Credentials {
  token: string;
  /** Spread into `.set(...)`: `{ Authorization: "Bearer <token>" }`. */
  auth: { Authorization: string };
  /** `user` from the login (or register) response body. */
  user: { id: string } & Record<string, unknown>;
}

export interface RegisterAndLoginOptions {
  name?: string;
  email?: string;
  password?: string;
  /** Replaces the default `POST /auth/register` call. */
  register?: (t: TestApp, credentials: Credentials) => Promise<Response>;
  /** Replaces the default `POST /auth/login` call. */
  login?: (t: TestApp, credentials: Credentials) => Promise<Response>;
  /** Runs after login, e.g. an owner invites this user into a workspace through the API. */
  afterLogin?: (t: TestApp, session: Session) => Promise<void>;
}

let counter = 0;

/** Registers a fresh user (unique email per call) and logs in. Throws with the response when a step fails. */
export async function registerAndLogin(t: TestApp, options: RegisterAndLoginOptions = {}): Promise<Session> {
  counter += 1;
  const credentials: Credentials = {
    name: options.name ?? `Test User ${counter}`,
    email: options.email ?? `user${counter}.${Date.now()}@example.test`,
    password: options.password ?? "correct-horse-battery",
  };

  const registered = await (options.register ?? defaultRegister)(t, credentials);
  expectSuccess("register", registered);
  const loggedIn = await (options.login ?? defaultLogin)(t, credentials);
  expectSuccess("login", loggedIn);

  const body = loggedIn.body as Record<string, unknown>;
  const token = [body.accessToken, body.token, body.access_token].find((value) => typeof value === "string") as
    | string
    | undefined;
  if (!token) {
    throw new Error(`registerAndLogin: login response has no access token: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const user = (body.user ?? (registered.body as Record<string, unknown>).user ?? {}) as Session["user"];
  const session: Session = { ...credentials, token, auth: { Authorization: `Bearer ${token}` }, user };
  await options.afterLogin?.(t, session);
  return session;
}

function defaultRegister(t: TestApp, credentials: Credentials): Promise<Response> {
  return t.http.post("/auth/register").send(credentials);
}

function defaultLogin(t: TestApp, credentials: Credentials): Promise<Response> {
  return t.http.post("/auth/login").send({ email: credentials.email, password: credentials.password });
}

function expectSuccess(step: string, response: Response): void {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`registerAndLogin: ${step} returned ${response.status}: ${response.text.slice(0, 300)}`);
  }
}

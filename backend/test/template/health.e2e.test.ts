import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, type TestApp } from "../helpers/app";

// Template-owned smoke test: proves the app boots and errors use the envelope. Not a feature test.
describe("template (e2e)", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it("GET /health returns ok", async () => {
    const res = await t.http.get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("an unknown route returns 404 in the error envelope", async () => {
    const res = await t.http.post("/does-not-exist").send({});
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: "NOT_FOUND", message: expect.any(String) } });
  });
});

// Example acceptance test file: test/e2e/projects.e2e.test.ts for a WorkBoard-like product.
// Black box: only the API, the contract and the helpers. Every test fails until the feature exists.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerAndLogin } from "../helpers/api";
import { createTestApp, type TestApp } from "../helpers/app";
import { expectMatchesContract } from "../helpers/contract";

describe("projects (e2e)", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it("STORY-006: a member creates a project in their workspace (201)", async () => {
    const owner = await registerAndLogin(t);
    const ws = await t.http.post("/workspaces").set(owner.auth).send({ name: "Acme" });
    const res = await t.http.post(`/workspaces/${ws.body.id}/projects`).set(owner.auth).send({ name: "Roadmap" });
    expect(res.status).toBe(201);
    expectMatchesContract(res, "createProject");
    expect(res.body).toMatchObject({ name: "Roadmap", workspaceId: ws.body.id });
  });

  it("STORY-006: creating a project without a token is rejected (401)", async () => {
    const res = await t.http.post("/workspaces/1/projects").send({ name: "Roadmap" });
    expect(res.status).toBe(401);
    expectMatchesContract(res, "createProject");
  });

  it("STORY-007: viewer cannot create a project (403 FORBIDDEN)", async () => {
    const owner = await registerAndLogin(t);
    const ws = await t.http.post("/workspaces").set(owner.auth).send({ name: "Acme" });
    const viewer = await registerAndLogin(t, {
      afterLogin: async (app, session) => {
        await app.http.post(`/workspaces/${ws.body.id}/members`).set(owner.auth).send({ email: session.email, role: "VIEWER" });
      },
    });
    const res = await t.http.post(`/workspaces/${ws.body.id}/projects`).set(viewer.auth).send({ name: "Roadmap" });
    expect(res.status).toBe(403);
    expectMatchesContract(res, "createProject");
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});

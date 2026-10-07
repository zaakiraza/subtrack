/**
 * Boots the real AppModule for API tests, with the database swapped for in-memory SQLite.
 */
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import type { Db } from "../../src/db/database";
import { DB } from "../../src/db/db.module";
import { createTestDb } from "./db";

export interface TestApp {
  app: INestApplication;
  /** supertest client bound to the app: `t.http.post("/path").set(auth).send(body)`. */
  http: ReturnType<typeof request>;
  db: Db;
  close(): Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  // Tests never read the workspace .env; a fixed secret keeps tokens verifiable within the run.
  process.env.JWT_SECRET ??= "test-only-jwt-secret";
  const db = createTestDb();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DB)
    .useValue(db)
    .compile();
  const app = moduleRef.createNestApplication({ logger: false });
  await app.init();
  return { app, db, http: request(app.getHttpServer()), close: () => app.close() };
}

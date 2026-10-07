import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { applyMigrations, openDatabase } from "./db/database";
import { seedDemo } from "./db/seed";

/** Boots the API. Config from env: DATABASE_URL, JWT_SECRET, PORT, SEED_DEMO, CORS_ORIGIN. */
async function bootstrap(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL ?? "file:./data/app.db";
  const db = openDatabase(dbUrl);
  try {
    applyMigrations(db);
    if (process.env.SEED_DEMO !== "0") {
      await seedDemo(db);
    }
  } finally {
    db.$client.close();
  }

  const app = await NestFactory.create(AppModule);
  const origin = process.env.CORS_ORIGIN?.trim();
  if (origin) {
    app.enableCors({ origin, credentials: true });
  }
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap();

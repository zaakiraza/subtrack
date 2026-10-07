import { Global, Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import { type Db, openDatabase } from "./database";

/** Injection token for the Drizzle database: `constructor(@Inject(DB) private readonly db: Db)`. */
export const DB = "DB";
export type { Db };

@Global()
@Module({
  providers: [{ provide: DB, useFactory: (): Db => openDatabase(process.env.DATABASE_URL ?? "file:./data/app.db") }],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(DB) private readonly db: Db) {}

  onApplicationShutdown(): void {
    this.db.$client.close();
  }
}

/**
 * `npm run db:regenerate`: replaces the migrations written since the last commit with one fresh
 * migration generated from the current `src/db/schema.ts`.
 *
 * Use it when a generated migration is wrong (for example, generated from a schema you have since
 * fixed). Committed migrations are never touched: only files in `drizzle/` that git does not track
 * yet are removed, and tracked files there (the journal) are restored to their committed state.
 * Never edit files in `drizzle/` by hand.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, rmdirSync, rmSync } from "node:fs";
import { join } from "node:path";

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" });
}

const pending = git(["ls-files", "--others", "--exclude-standard", "--", "drizzle"])
  .split(/\r?\n/)
  .filter(Boolean);
for (const file of pending) {
  rmSync(file, { force: true });
}
// drizzle-kit fails on a `meta/` folder without its journal, so folders left empty go too.
removeEmptyFolders("drizzle");
const tracked = git(["ls-files", "--", "drizzle"]).split(/\r?\n/).filter(Boolean);
if (tracked.length > 0) {
  git(["checkout", "--", ...tracked]);
}

function removeEmptyFolders(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const child = join(dir, entry.name);
      removeEmptyFolders(child);
      if (readdirSync(child).length === 0) {
        rmdirSync(child);
      }
    }
  }
}
console.log(pending.length > 0 ? `Removed uncommitted migration files: ${pending.join(", ")}` : "No uncommitted migration files.");

execFileSync(process.execPath, [join("node_modules", "drizzle-kit", "bin.cjs"), "generate"], { stdio: "inherit" });

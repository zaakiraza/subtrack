import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// API tests (test/). Serial: each file boots its own app, and ordering keeps failures readable.
export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    include: ["test/**/*.e2e.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30_000,
    reporters: ["default", "json"],
    outputFile: { json: ".gate/e2e.json" },
  },
});

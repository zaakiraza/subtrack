import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Unit tests (src/). SWC emits the decorator metadata Nest's dependency injection needs.
export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    reporters: ["default", "json"],
    outputFile: { json: ".gate/unit.json" },
  },
});

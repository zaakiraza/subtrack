// @ts-check
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");

module.exports = defineConfig(
  { ignores: ["dist/**", "node_modules/**", "drizzle/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);

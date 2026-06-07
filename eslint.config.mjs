import tseslint from "typescript-eslint";
import eslintPluginYml from "eslint-plugin-yml";
import * as espree from "espree";

export default tseslint.config(
  {
    ignores: ["**/dist/", "**/node_modules/", "**/coverage/", "archive/**"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  // Package boundary: extensions and harnesses are environment-agnostic and must
  // depend only on @ecp/types + @ecp/core. They may not import host packages.
  // Scoped to `src` so integration tests may still use a host runtime.
  {
    files: [
      "packages/extensions/**/src/**/*.ts",
      "packages/harnesses/**/src/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@ecp/node",
                "@ecp/node/*",
                "@ecp/browser",
                "@ecp/browser/*",
                "@ecp/cli",
                "@ecp/cli/*",
                "@ecp/mcp",
                "@ecp/mcp/*",
              ],
              message:
                "Extensions and harnesses must not import host packages (@ecp/node, @ecp/browser, @ecp/cli, @ecp/mcp). Depend on @ecp/types and @ecp/core only.",
            },
          ],
        },
      ],
    },
  },
  ...eslintPluginYml.configs["flat/base"],
  {
    files: ["**/*.yaml", "**/*.yml"],
    rules: {
      "yml/block-mapping": ["error", "always"],
    },
  },
  // Use ESLint's JS parser for plain JS files (shebangs, CJS bins, scripts).
  // Placed at the end so it overrides the TypeScript parser configs above.
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      parser: espree,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
      },
    },
  },
  // CJS entrypoints (npm Windows shims) need `require`.
  {
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);

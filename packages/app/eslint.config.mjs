import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Enforced dependency direction (engineering-standards.md): db is the
      // only package allowed to import @mikro-orm/*.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@mikro-orm/*"],
              message: "Only @devmentor/db may import MikroORM directly — go through @devmentor/core/db.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

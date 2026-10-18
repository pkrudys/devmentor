import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Enforced dependency direction (engineering-standards.md): "ui
      // importable by app only" — ui must not reach into core/db/app.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@devmentor/app", message: "@devmentor/ui must not depend on @devmentor/app." },
            { name: "@devmentor/core", message: "@devmentor/ui must not depend on @devmentor/core." },
            { name: "@devmentor/db", message: "@devmentor/ui must not depend on @devmentor/db." },
          ],
        },
      ],
    },
  }
);

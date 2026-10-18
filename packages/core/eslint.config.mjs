import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Enforced dependency direction (engineering-standards.md): core never
      // depends on the framework layers above it.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "next", message: "@devmentor/core must not depend on Next.js." },
            { name: "react", message: "@devmentor/core must not depend on React." },
            { name: "react-dom", message: "@devmentor/core must not depend on React." },
            { name: "@devmentor/app", message: "@devmentor/core must not depend on @devmentor/app." },
            { name: "@devmentor/ui", message: "@devmentor/core must not depend on @devmentor/ui." },
          ],
        },
      ],
    },
  }
);

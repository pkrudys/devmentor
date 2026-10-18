import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Enforced dependency direction (engineering-standards.md): db sits
      // below everything and depends on nothing in this monorepo.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "next", message: "@devmentor/db must not depend on Next.js." },
            { name: "react", message: "@devmentor/db must not depend on React." },
            { name: "react-dom", message: "@devmentor/db must not depend on React." },
            { name: "@devmentor/app", message: "@devmentor/db must not depend on @devmentor/app." },
            { name: "@devmentor/core", message: "@devmentor/db must not depend on @devmentor/core." },
            { name: "@devmentor/ui", message: "@devmentor/db must not depend on @devmentor/ui." },
          ],
        },
      ],
    },
  }
);

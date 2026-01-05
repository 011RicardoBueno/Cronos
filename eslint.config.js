import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      import: importPlugin,
    },

    rules: {
      /* =========================
       * REACT
       * ========================= */
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      /* =========================
       * IMPORTS – GOVERNANÇA
       * ========================= */
      "import/no-unresolved": "error",
      "import/no-cycle": ["error", { maxDepth: 1 }],
      "import/no-duplicates": "error",

      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      /* =========================
       * BARREL FILE ENFORCEMENT
       * ========================= */
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/components/ui/*",
                "!**/components/ui/index.*",
              ],
              message:
                "Importe via components/ui (barrel file). Import direto é proibido.",
            },
            {
              group: [
                "**/components/dashboard/**",
                "!**/components/dashboard/index.*",
              ],
              message:
                "Use o barrel file de components/dashboard.",
            },
            {
              group: [
                "**/components/widgets/*",
                "!**/components/widgets/index.*",
              ],
              message:
                "Importe widgets via barrel file.",
            },
          ],
        },
      ],
    },

    settings: {
      react: {
        version: "detect",
      },
    },
  },
];

import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import stylisticJs from "@stylistic/eslint-plugin-js";
import unusedImports from "eslint-plugin-unused-imports";
import importPlugin from "eslint-plugin-import";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@stylistic/js": stylisticJs,
      "unused-imports": unusedImports,
      import: importPlugin,
      "no-relative-import-paths": noRelativeImportPaths,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "@stylistic/js/no-tabs": ["error", { allowIndentationTabs: false }],
      "@stylistic/js/nonblock-statement-body-position": ["error", "beside"],
      "no-multi-spaces": ["error"],
      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        { allowSameFolder: true },
      ],
      "import/no-duplicates": ["error", { considerQueryString: true }],
      "unused-imports/no-unused-imports": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
    },
  },
];

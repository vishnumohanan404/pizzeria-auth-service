// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    ignores: [
      "dist",
      "node_modules",
      "eslint.config.mjs",
      "scripts",
      "jest.config.js",
      "*.spec.ts",
      "tests/",
      "coverage/",
      ".github/",
      "README.md",
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-console": "error",
      "dot-notation": "error",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
);

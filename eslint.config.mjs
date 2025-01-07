// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    ignores: ["dist", "node_modules", "jest.config.js", "**/*.mjs", "test"],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        allowDefaultProject: true,
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

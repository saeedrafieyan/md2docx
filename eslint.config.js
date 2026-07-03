import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "tmp/**",
      "coverage/**",
      "public/**",
      "eslint.config.js",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
);

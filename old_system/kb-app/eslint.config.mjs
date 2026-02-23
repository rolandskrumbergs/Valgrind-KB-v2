import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactNative from "eslint-plugin-react-native";
import prettierPlugin from "eslint-plugin-prettier";
import tailwindcss from "eslint-plugin-tailwindcss";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json"],
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react,
      "react-hooks": reactHooks,
      "react-native": reactNative,
      prettier: prettierPlugin,
      tailwindcss,
      import: importPlugin,
    },
    rules: {
      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",

      // React
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // React Native
      "react-native/no-unused-styles": "warn",
      "react-native/no-inline-styles": "off",
      "react-native/split-platform-components": "off",

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Prettier
      "prettier/prettier": [
        "warn",
        {
          endOfLine: "crlf",
        },
      ],

      // General
      "no-console": "off",

      // Tailwind
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-custom-classname": "off",
    },
  },
];

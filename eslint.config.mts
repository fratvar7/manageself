import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

export default [
  // 1️⃣ JS base
  js.configs.recommended,

  // 2️⃣ TypeScript
  ...tseslint.configs.recommended,

  // 3️⃣ React
  {
    files: ["**/*.{jsx,tsx}"],
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      "react/react-in-jsx-scope": "off"
    }
  },

  // 4️⃣ Globals
  {
    languageOptions: {
      globals: globals.es2021
    }
  },

  // 5️⃣ Type-aware (opcional)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json"
      }
    }
  }
];

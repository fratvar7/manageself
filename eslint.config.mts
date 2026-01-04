import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

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
    plugins: {
      'react-hooks': reactHooks,         // Plugin para React Hooks
      'react-refresh': reactRefresh,     // Plugin para Fast Refresh
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      'no-unused-vars': 'off',           // Variables no usadas - desactivado para interfaces
      'no-console': 'warn',                // Uso de console.log
      'prefer-const': 'error',              // Usar const en vez de let cuando posible

      // React específicas
      'react-hooks/rules-of-hooks': 'error', // Reglas de Hooks
      'react-hooks/exhaustive-deps': 'warn', // Dependencias de useEffect

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn', // Evitar any
      '@typescript-eslint/no-unused-vars': 'error', // Usar la versión de TypeScript en su lugar
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

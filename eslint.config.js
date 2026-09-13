import reactHooks from "/app/frontend/node_modules/eslint-plugin-react-hooks/index.js";
import react from "/app/frontend/node_modules/eslint-plugin-react/index.js";

export default [
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    plugins: {
      "react-hooks": reactHooks,
      react: react
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/build/**",
      "**/dist/**",
      "**/backend/**",
      "**/.emergent/**",
      "**/coverage/**",
      "**/capacitor-plugins/**",
      "**/*.ts",
      "**/*.tsx"
    ]
  }
];

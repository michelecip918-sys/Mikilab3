const reactHooks = require("./node_modules/eslint-plugin-react-hooks/index.js");
const react = require("./node_modules/eslint-plugin-react/index.js");

module.exports = [
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
      "**/coverage/**"
    ]
  }
];

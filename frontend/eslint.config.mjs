export default [
  {
    ignores: ["dist/**", "node_modules/**", "build/**"]
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off"
    }
  }
];


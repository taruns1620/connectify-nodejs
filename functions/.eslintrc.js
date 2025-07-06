
module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
    tsconfigRootDir: __dirname, // Point ESLint to the functions directory
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/node_modules/**/*", // Ignore node_modules
    ".eslintrc.js", // Ignore this file itself
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 4], // Use 4 spaces for indentation
    "object-curly-spacing": ["error", "always"],
    "max-len": ["error", {"code": 120}], // Increase max line length
    "require-jsdoc": 0, // Disable requirement for JSDoc comments
    "@typescript-eslint/no-explicit-any": "warn", // Warn instead of error for 'any'
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], // Warn on unused vars, ignore if starts with _
  },
};

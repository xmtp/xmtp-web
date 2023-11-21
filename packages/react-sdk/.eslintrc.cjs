module.exports = {
  root: true,
  extends: ["xmtp-web"],
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  ignorePatterns: ["lib/**/*"],
  rules: {
    "@typescript-eslint/no-unnecessary-type-assertion": "off",
    "import/extensions": "off",
  },
};

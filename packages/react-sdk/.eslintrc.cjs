module.exports = {
  root: true,
  extends: ["xmtp-web", "plugin:storybook/recommended"],
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  ignorePatterns: ["lib/**/*"],
  rules: {
    "@typescript-eslint/no-unnecessary-type-assertion": "off",
    "import/extensions": "off",
  },
};

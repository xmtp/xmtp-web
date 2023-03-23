module.exports = {
  root: true,
  extends: ["xmtp", "plugin:storybook/recommended"],
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  ignorePatterns: ["lib/**/*"],
};

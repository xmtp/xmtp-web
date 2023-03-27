module.exports = {
  root: true,
  extends: ["xmtp-web", "plugin:storybook/recommended"],
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  ignorePatterns: ["lib/**/*"],
};

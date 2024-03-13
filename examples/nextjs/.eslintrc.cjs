module.exports = {
  root: true,
  extends: ["xmtp-web"],
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  rules: {
    "react/function-component-definition": "off",
  },
};

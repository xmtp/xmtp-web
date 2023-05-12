# React Quickstart example app

![Status](https://img.shields.io/badge/Project_Status-Developer_Preview-yellow)

React Quickstart is an example app built using the [React XMTP client SDK](/packages/react-sdk/README.md), [React](https://react.dev/), [Vite](https://vitejs.dev/), and [RainbowKit](https://www.rainbowkit.com/).

This example app is in **Developer Preview** status and ready to serve as a reference for you to start building with.

However, we do not recommend using Developer Preview software in production apps.

To keep up with the latest example app developments, see the [Issues tab](https://github.com/xmtp/xmtp-web/issues) in this repo.

To learn more about XMTP and get answers to frequently asked questions, see [FAQ about XMTP](https://xmtp.org/docs/dev-concepts/faq).

### Limitations

This example app demonstrates features of the React XMTP client SDK, but it isn't a complete solution. For example, the list of conversations doesn't update when new messages arrive in existing conversations.

## Developing

Run `yarn build` and then `yarn dev` to start developing.

## Useful commands

- `yarn build`: Builds the example app
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn dev`: Launches the example app in development mode at `http://127.0.0.1:5173`
- `yarn format`: Runs prettier format and write changes
- `yarn format:check`: Runs prettier format check
- `yarn lint`: Runs ESLint
- `yarn typecheck`: Runs `tsc`

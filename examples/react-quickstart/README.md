# React quickstart app

![Status](https://img.shields.io/badge/Project_Status-Beta-yellow)

Use this React quickstart app as a tool to start building an app with XMTP. This basic messaging app has an intentionally unopinionated UI to help make it easier for you to build with.

The app is built using the [React XMTP client SDK](/packages/react-sdk/README.md), [React](https://react.dev/), [Vite](https://vitejs.dev/), and [RainbowKit](https://www.rainbowkit.com/).

This app is in **beta** status and ready to serve as a reference for you to start building with.

However, we do not recommend using beta software in production apps.

To keep up with the latest quickstart app developments, see the [Issues tab](https://github.com/xmtp/xmtp-web/issues) in this repo.

To learn more about XMTP and get answers to frequently asked questions, see the [XMTP documentation](https://xmtp.org/docs).

### Limitations

This React quickstart app isn't a complete solution. For example, the list of conversations doesn't update when new messages arrive in existing conversations.

## Developing

1. In `packages/react-sdk`, run `yarn build` to build the SDK.

2. In `examples/react-quickstart`, run `yarn dev` to start developing.

## Useful commands

- `yarn build`: Builds the example app
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn dev`: Launches the example app and watches for changes, which will trigger a rebuild
- `yarn format`: Runs prettier format and write changes
- `yarn format:check`: Runs prettier format check
- `yarn lint`: Runs ESLint
- `yarn typecheck`: Runs `tsc`

# React app

![Status](https://img.shields.io/badge/Project_Status-Beta-yellow)

Use this React app as a tool to start building an app with XMTP. This basic messaging app has an intentionally unopinionated UI to help make it easier for you to build with.

The app is built using the [React XMTP client SDK](/packages/react-sdk/README.md), [React](https://react.dev/), and [RainbowKit](https://www.rainbowkit.com/).

This app is in **beta** status and ready to serve as a reference for you to start building with.

However, we do not recommend using beta software in production apps.

To keep up with the latest React app developments, see the [Issues tab](https://github.com/xmtp/xmtp-web/issues) in this repo.

To learn more about XMTP and get answers to frequently asked questions, see the [XMTP documentation](https://xmtp.org/docs).

### Limitations

This React app isn't a complete solution. For example, the list of conversations doesn't update when new messages arrive in existing conversations.

## Useful commands

- `yarn clean`: Removes `node_modules` and `.turbo` folders
- `yarn format`: Runs prettier format and write changes
- `yarn format:check`: Runs prettier format check
- `yarn lint`: Runs ESLint
- `yarn typecheck`: Runs `tsc`

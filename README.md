# XMTP web SDKs and examples

This is the official repository for XMTP web SDKs and examples, powered by [Turborepo](https://turbo.build/repo).

To learn more about the contents of this repository, see this README and the READMEs provided for [packages](https://github.com/xmtp/xmtp-web/tree/main/packages) and [examples](https://github.com/xmtp/xmtp-web/tree/main/examples).

## What's inside?

### Packages

- [`eslint-config-xmtp-web`](https://github.com/xmtp/xmtp-web/blob/main/packages/eslint-config-xmtp-web): An opinionated ESLint configuration for XMTP web projects
- [`react-sdk`](https://github.com/xmtp/xmtp-web/blob/main/packages/react-sdk): React XMTP client SDK
- [`react-components`](https://github.com/xmtp/xmtp-web/blob/main/packages/react-components): **Experimental**: React components for building React apps with XMTP
- [`tsconfig`](https://github.com/xmtp/xmtp-web/blob/main/packages/tsconfig): Internal package for sharing `tsconfig.json` files

### Examples

- [`react-quickstart`](https://github.com/xmtp/xmtp-web/blob/main/examples/react-quickstart): A quickstart example app using [React](https://react.dev/), [Vite](https://vitejs.dev/), and [RainbowKit](https://www.rainbowkit.com/)

## Requirements

- Node 18+
- React 16.14+
- Yarn v3+ is required only when working with this repo. See [Yarn Installation](https://yarnpkg.com/getting-started/install).
  > **Tip**  
  > If you have an earlier version of yarn installed, try running `yarn set version berry` to upgrade to a compatible version.

## Developing

After installing the requirements, run `yarn && yarn dev` to start developing.

## Useful commands

- `yarn build`: Builds the `packages/react-sdk` and `packages/react-components` packages
- `yarn clean`: Remove all `node_modules`, `.turbo`, and build folders, clear Yarn cache
- `yarn quickstart`: Builds `packages/react-sdk` and `packages/react-components`, then runs the `examples/react-quickstart` app in dev mode.
- `yarn format`: Run prettier format and write changes on all packages
- `yarn format:check`: Run prettier format check on all packages
- `yarn lint`: Lint all packages
- `yarn test`: Test all packages
- `yarn typecheck`: Typecheck all packages

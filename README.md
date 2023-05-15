# XMTP web SDKs and examples

This is the official repository for XMTP web SDKs and examples, powered by [Turborepo](https://turbo.build/repo).

To learn more about the contents of this repository, see this README and the READMEs provided for [packages](https://github.com/xmtp/xmtp-web/tree/main/packages) and [examples](https://github.com/xmtp/xmtp-web/tree/main/examples).

## What's inside?

### Packages

- [`eslint-config-xmtp-web`](packages/eslint-config-xmtp-web): An opinionated ESLint configuration for XMTP web projects
- [`react-sdk`](packages/react-sdk): 🧑‍💻 Dev preview: React XMTP client SDK
- [`tsconfig`](packages/tsconfig): Internal package for sharing `tsconfig.json` files

### Examples

- [`react-quickstart`](examples/react-quickstart): 🧑‍💻 Dev preview: A quickstart example app using [React](https://react.dev/), [Vite](https://vitejs.dev/), and [RainbowKit](https://www.rainbowkit.com/)

## Requirements

- Node 16.10+
- React 16.14+
- Yarn v3+. See [Yarn Installation](https://yarnpkg.com/getting-started/install).

## Developing

After installing the requirements, run `yarn && yarn dev` to start developing.

## Useful commands

- `yarn build`: Build all packages
- `yarn clean`: Remove all `node_modules`, `.turbo`, and build folders, clear Yarn cache
- `yarn dev`: Builds all packages and examples and watches for changes, which will trigger rebuilds
- `yarn format`: Run prettier format and write changes on all packages
- `yarn format:check`: Run prettier format check on all packages
- `yarn lint`: Lint all packages
- `yarn test`: Test all packages
- `yarn typecheck`: Typecheck all packages

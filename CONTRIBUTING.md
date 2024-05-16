# Contributing

Thank you for considering contributing to this repo! Community contributions like yours are key to the development and adoption of XMTP. Your questions, feedback, suggestions, and code contributions are welcome!

## ❔ Questions

Have a question about how to build with XMTP? Ask your question and learn with the community in the [XMTP Community Forums](https://community.xmtp.org/).

## 🐞 Bugs

Report a bug using [GitHub Issues](https://github.com/xmtp/xmtp-web/issues).

## ✨ Feature requests

Request a feature using [GitHub Issues](https://github.com/xmtp/xmtp-web/issues).

## 🔀 Pull requests

PRs are encouraged, but consider starting with a feature request to temperature-check first. If the PR involves a major change to the protocol, the work should be fleshed out as an [XMTP Improvement Proposal](https://community.xmtp.org/t/xip-0-xip-purpose-process-guidelines/475) before work begins.

After a pull request is submitted, a single approval is required to merge it.

## 🔧 Developing

### Prerequisites

#### Node

Please make sure you have a compatible version as specified in `package.json`. We recommend using a Node version manager such as [nvm](https://github.com/nvm-sh/nvm) or [nodenv](https://github.com/nodenv/nodenv).

#### Yarn

This repository uses the [Yarn package manager](https://yarnpkg.com/). To use it, enable [Corepack](https://yarnpkg.com/corepack), if it isn't already, by running `corepack enable`.

### Useful commands

- `yarn`: Installs all dependencies
- `yarn build`: Builds the `packages/react-sdk` package
- `yarn clean`: Remove all `node_modules`, `.turbo`, and build folders, clear Yarn cache
- `yarn quickstart`: Builds `packages/react-sdk`, then runs the `examples/react-vite` example in dev mode.
- `yarn format`: Run prettier format and write changes on all packages
- `yarn format:check`: Run prettier format check on all packages
- `yarn lint`: Lint all packages
- `yarn test`: Test all packages
- `yarn test:setup`: Start a local development node using Docker (only needs to be run once)
- `yarn typecheck`: Typecheck all packages

### Testing and validation

Please add unit tests when appropriate and ensure that all unit tests are passing before submitting a pull request. Note that some unit tests require a backend node to be running locally. The `test:setup` command can be run a single time to start the node in the background using Docker.

Manual validation requires running a client app such as this [example app](/examples/react-vite/). The example apps use their associated SDK located in this repo. SDKs must be built before running one of its example apps. To see updates in realtime, build the SDK in watch mode, which will watch for changes and trigger a rebuild.

## 🚢 Publishing

This repository uses [changesets](https://github.com/changesets/changesets) to publish updates. Pull requests must contain a changeset in order for changes to be published. The [changeset-bot](https://github.com/apps/changeset-bot) will guide you through this process.

> **Important**  
> When adding a new package to this repository that will be published, a new granular NPM token must be created to include read/write access to it.

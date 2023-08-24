# @xmtp/react-sdk

## 1.1.0

### Minor Changes

- [#62](https://github.com/xmtp/xmtp-web/pull/62) [`edb0a4d`](https://github.com/xmtp/xmtp-web/commit/edb0a4df15019a3a8c7ccecd0be47f140563ba31) Thanks [@rygine](https://github.com/rygine)! - Refactor processing of remote attachment content types. This update removes eager loading of remote data in the message processor in favor of the new `useAttachment` hook. With the `useAttachment` hook, developers can now respond to loading and error states when fetching the remote data.

## 1.0.0 (2023-08-21) release notes

This is the first production release of the XMTP React client SDK, a React integration of the xmtp-js SDK.

This release delivers:

- Local-first architecture, which includes optimistic sending
- Support for standards-track content types via configuration

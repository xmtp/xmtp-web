# @xmtp/react-sdk

## 1.1.2

### Patch Changes

- [#68](https://github.com/xmtp/xmtp-web/pull/68) [`9678bdb`](https://github.com/xmtp/xmtp-web/commit/9678bdb724ab16fd3eb5db2a1a7780c159e19b9d) Thanks [@rygine](https://github.com/rygine)! - Fix `useAttachment` hook by resetting loading state when an error occurs during the loading of a remote attachment

## 1.1.1

### Patch Changes

- Add remote attachment data to the cache after load
- Update streaming hooks to prevent duplicate streams

## 1.1.0

### Minor Changes

- Refactor processing of remote attachment content types. This update removes eager loading of remote data in the message processor in favor of the new `useAttachment` hook. With the `useAttachment` hook, developers can now respond to loading and error states when fetching the remote data.

## 1.0.0 (2023-08-21) release notes

This is the first production release of the XMTP React client SDK, a React integration of the xmtp-js SDK.

This release delivers:

- Local-first architecture, which includes optimistic sending
- Support for standards-track content types via configuration

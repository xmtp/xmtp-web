# @xmtp/react-sdk

## 1.3.0

### Minor Changes

- [#72](https://github.com/xmtp/xmtp-web/pull/72) [`79742c1`](https://github.com/xmtp/xmtp-web/commit/79742c1088bd3ef0d7fad1829b1130f520737dc7) Thanks [@rygine](https://github.com/rygine)! - Refactor `useAttachment` hook

  - Added options `disableAutoload` and `autoloadMaxFileSize`
  - Added `status` export
  - Removed `isLoading` export
  - Renamed `retry` => `load`
  - Prevent autoload from occurring if there was previously a load error

  Added `hasLoadError` property to `CachedMessage` for when message content loading fails (this only applies to remote attachments for now)

  Updated the type of the `messages` export of the `useMessages` hook to be `CachedMessageWithId[]`

## 1.2.0

### Minor Changes

- Add `cancel` function to `useResendMessage` hook, rename `resendMessage` to `resend`.

## 1.1.2

### Patch Changes

- Fix `useAttachment` hook by resetting loading state when an error occurs during the loading of a remote attachment

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

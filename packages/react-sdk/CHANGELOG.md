# @xmtp/react-sdk

## 1.4.0-beta.1

### Minor Changes

- Upgrade xmtp-js to beta.9

## 1.4.0-beta.0

### Minor Changes

- Update xmtp-js to version 11 [`b121750`](https://github.com/xmtp/xmtp-web/commit/b121750f33f42ee40a9d3a5b4d196c433d1209e5)\

## 1.3.6

### Patch Changes

- Rename `hasTopic` => `hasConversationTopic`
- Add exports for `hasConversationTopic`, `saveConversation`, `setConversationUpdatedAt`, `updateConversation`, `updateConversationMetadata`, `deleteMessage`, `getLastMessage`, `saveMessage`, `updateMessage`, and `updateMessageMetadata`

## 1.3.5

### Patch Changes

- Export some conversation helpers

## 1.3.4

### Patch Changes

- Prevent DB versioning when DB is already open

## 1.3.3

### Patch Changes

- Make content type config processors optional
- Add type exports for content type configs

## 1.3.2

### Patch Changes

- Upgrade JS SDK to 10.2.1 for deterministic topic fix

## 1.3.1

### Patch Changes

- Fix `useClient` and `useAttachment` performance

## 1.3.0

### Minor Changes

- Refactor `useAttachment` hook
  - Added options `disableAutoload` and `autoloadMaxFileSize`
  - Added `status` export
  - Removed `isLoading` export
  - Renamed `retry` => `load`
  - Prevent autoload from occurring if there was previously a load error
- Added `hasLoadError` property to `CachedMessage` for when message content loading fails (this only applies to remote attachments for now)
- Updated the type of the `messages` export of the `useMessages` hook to be `CachedMessageWithId[]`

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

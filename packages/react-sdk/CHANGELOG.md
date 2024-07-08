# @xmtp/react-sdk

## 7.0.1

### Patch Changes

- 3fc5b82: Fixed dev and peer dependencies

## 7.0.0

### Major Changes

- cd41019:
  - Upgraded to latest JS SDK
  - Removed some re-exports from the JS SDK

### BREAKING CHANGES

With this update, the following are no longer exported from the React SDK: `ContentTypeId`, `CodecRegistry`, `ContentCodec`, `EncodedContent`, `TextCodec`, and `ContentTypeText`.

For content type primitives, use the new `@xmtp/content-type-primitives` package. It exports `ContentTypeId`, `CodecRegistry`, `ContentCodec`, and `EncodedContent`.

The text content type and codec can now be found at `@xmtp/content-type-text`. It exports `ContentTypeText`, `Encoding`, and `TextCodec`.

## 6.0.1

### Patch Changes

- ab0daa6: Export `useMessage` hook

## 6.0.0

### Major Changes

- ada4d7f: Reorganize dependencies

  **BREAKING CHANGE:** Some `dependencies` have been moved to `peerDependencies` and must now be installed separately. This includes `react`, `@xmtp/xmtp-js`, `@xmtp/content-type-reaction`, `@xmtp/content-type-remote-attachment`, and `@xmtp/content-type-reply`.

## 5.2.0

### Minor Changes

- 424041b: Upgrade to latest JS SDK and content types

## 5.1.0

### Minor Changes

- 6371094: Upgraded JS SDK, `viem`, and `dexie`

## 5.0.3

### Patch Changes

- bf16c8a: Upgraded to JS SDK `11.3.12`

## 5.0.2

### Patch Changes

- 73ef32d: Ensure consent DB is in sync with the network

## 5.0.1

### Patch Changes

- b9f49cc: Fixed existing conversation lookup by adding `walletAddress` to DB query

## 5.0.0

### Major Changes

- a3fda91: Add support for multiple wallets to consent

  Since this changes the API of several exports, it's a breaking change that requires a major release.

## 4.0.2

### Patch Changes

- a73d36b: Fix MetaMask snaps integration

## 4.0.1

### Patch Changes

- Upgraded dependencies
- Removed `generate:types` command
- Fixed broken links in README

## 4.0.0

### Breaking Changes

- Removed CommonJS bundle
- Removed official support for the read receipt content type

### Other Changes

- Replaced `tsup` with `rollup` for bundling, fixed source maps
- Upgraded `date-fns` to `3.1.0`

## 3.1.1

### Patch Changes

- Changed `isBlocked` to `isDenied`

## 3.1.0

### Minor Changes

- Upgraded JS SDK to `11.3.0` for consent support
- Added `useConsent` hook for working with consent
- Added `useStreamConsentList` hook for streaming consent actions

**Note:** This release uses a first-party dependency that includes WASM, which may require additional configuration in your bundler/framework of choice.

## 3.0.0

### Major Changes

- Upgraded JS SDK to `11.2.0`
- Refactored message sending to prepare messages prior to sending
- Refactored message processing to always cache messages
- Added `contentTypes` to content type config
- Removed unnecessary processors from some content type configs
- Added guard to prevent sending messages that haven't been fully processed
- Added `replies` table to local cache
- Updated reply helpers to work with new `replies` table
- Added `useReplies` hook that return replies to a specified message

## 2.2.6

### Patch Changes

#### Fixed imports of `date-fns` package for Next.js compatibility

- **Issue**: [Fix of reported bug #124](https://github.com/xmtp/xmtp-web/issues/124)
- **Changes**:
  - Changed imports from:
    ```javascript
    import xxx from "date-fns/xxx";
    ```
    to:
    ```javascript
    import { xxx } from "date-fns";
    ```
- **Affected Files**:
  - `packages/react-sdk/src/helpers/caching/contentTypes/readReceipt.test.ts`
  - `packages/react-sdk/src/helpers/caching/contentTypes/readReceipt.ts`
  - `packages/react-sdk/src/hooks/useMessages.ts`

## 2.2.5

### Patch Changes

- Upgraded JS SDK and content types to get latest `@xmtp/proto` changes

## 2.2.4

### Patch Changes

- Upgraded standards-track content types

## 2.2.3

### Patch Changes

- Added export for `getReplies` function

## 2.2.2

### Patch Changes

- Refactored the read receipt processor to ignore read receipts older than the current one or if the read receipt was sent by the current client
- Added tests for both cases outlined above

## 2.2.1

### Patch Changes

- Added a mutex to the reaction message processor so that messages are processed in order, which is important for determining the state of a message's reactions

## 2.2.0

### Minor Changes

- Added `sentAt` field to cached reactions to track when a reaction was made
- Updated `getReactionsByXmtpID` to return reactions sorted by `sentAt`
- Updated `useReactions` hook to return reactions sorted by `sentAt`

## 2.1.0

### Minor Changes

- Added `lastSyncedAt` property to cached conversations to track when a conversation's messages were last synced
- When loading new messages, use the `lastSyncedAt` time if it comes before the last message
- When an inactive tab becomes active again, the `useMessages` hook will re-sync the conversation messages from the network
- Added a new `disableAutoSync` option to `useMessages` hook to disable automatic syncing when a tab becomes active

## 2.0.0

### Major Changes

**BREAKING CHANGES**

- Remove `signer` and `setClientSigner` from `XMTPContext`

**OTHER CHANGES**

- Fix client initialization when using only keys
- Add test for client initialization with keys
- Upgraded dependencies

## 1.4.0

### Minor Changes

- Upgrade JS SDK to v11
- Upgrade all standards-track content types
- Replace `ethers` with `viem`
- Update read receipt processor for updated content type
- Update client signer type

## 1.3.7

### Patch Changes

- Add `isLoaded` state to the `useMessages` and `useConversations` hooks
- Add `clearCache` to exports
- Minor refactor of `useStartConversation` hook to export `conversation` when no initial message is sent
- Access all cached conversations using the client's wallet address

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

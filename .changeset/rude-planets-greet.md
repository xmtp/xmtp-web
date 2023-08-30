---
"@xmtp/react-sdk": minor
---

Refactor `useAttachment` hook

* Added options `autoload` and `autoloadMaxFileSize`
* Added `status` export
* Removed `isLoading` export
* Renamed `retry` => `load`
* Prevent autoload from occurring if there was previously a load error

Added `hasLoadError` property to `CachedMessage` for when message content loading fails (this only applies to remote attachments for now)

Updated the type of the `messages` export of the `useMessages` hook to be `CachedMessageWithId[]`

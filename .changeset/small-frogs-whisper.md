---
"@xmtp/react-sdk": major
---

* Upgraded JS SDK to `11.2.0`
* Refactored message sending to prepare messages prior to sending
* Refactored message processing to always cache messages
* Added `contentTypes` to content type config
* Removed unnecessary processors from some content type configs
* Added guard to prevent sending messages that haven't been fully processed
* Added `replies` table to local cache
* Updated reply helpers to work with new `replies` table
* Added `useReplies` hook that return replies to a specified message

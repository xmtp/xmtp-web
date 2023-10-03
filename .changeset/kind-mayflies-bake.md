---
"@xmtp/react-sdk": minor
---

* Added `lastSyncedAt` property to cached conversations to track when a conversation's messages were last synced
* When loading new messages, use the `lastSyncedAt` time if it comes before the last message
* When an inactive tab becomes active again, the `useMessages` hook will re-sync the conversation messages from the network
* Added a new `disableAutoSync` option to `useMessages` hook to disable automatic syncing when a tab becomes active

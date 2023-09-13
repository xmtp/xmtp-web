---
"@xmtp/react-sdk": patch
---

- Add `isLoaded` state to the `useMessages` and `useConversations` hooks
- Add `clearCache` to exports
- Minor refactor of `useStartConversation` hook to export `conversation` when no initial message is sent
- Access all cached conversations using the client's wallet address

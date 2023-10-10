---
"@xmtp/react-sdk": patch
---

- Added a mutex to the reaction message processor so that messages are processed in order, which is important for determining the state of a message's reactions

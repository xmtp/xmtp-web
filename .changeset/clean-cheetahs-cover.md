---
"@xmtp/react-sdk": patch
---

* Refactored the read receipt processor to ignore read receipts older than the current one or if the read receipt was sent by the current client
* Added tests for both cases outlined above

---
"@xmtp/react-sdk": minor
---

- Added caching of the consent list
- Added autoload of cached consent list on client create
- Added `useConsent` hook for working with consent
- Added `useStreamConsentList` hook for streaming in consent actions
- Added consent support to example app

**Note:** This update uses WASM and requires some configuration changes depending on the bundler used.

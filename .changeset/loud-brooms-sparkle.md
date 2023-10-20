---
"@xmtp/react-sdk": major
---

### Fixed imports of `date-fns` package for Next.js compatibility

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

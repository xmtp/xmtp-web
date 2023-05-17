// context
export { XMTPProvider } from "./contexts/XMTPContext";

// helpers
export { isValidAddress } from "./helpers/isValidAddress";

// hooks
export { useCanMessage } from "./hooks/useCanMessage";
export { useConversations } from "./hooks/useConversations";
export { useClient } from "./hooks/useClient";
export { useMessages } from "./hooks/useMessages";
export { useSendMessage } from "./hooks/useSendMessage";
export { useStartConversation } from "./hooks/useStartConversation";
export { useStreamAllMessages } from "./hooks/useStreamAllMessages";
export { useStreamConversations } from "./hooks/useStreamConversations";
export { useStreamMessages } from "./hooks/useStreamMessages";

export { Client, SortDirection } from "@xmtp/xmtp-js";

// re-export types from the JS SDK
export type * from "@xmtp/xmtp-js";

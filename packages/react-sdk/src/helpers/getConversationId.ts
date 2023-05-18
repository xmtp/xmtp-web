import type { Conversation } from "@xmtp/xmtp-js";

/**
 * Create a unique conversation ID based on sender/receiver addresses and
 * context values
 */
export const getConversationId = (conversation?: Conversation): string =>
  [
    conversation?.clientAddress,
    conversation?.peerAddress,
    conversation?.context?.conversationId,
  ]
    .filter((v) => Boolean(v))
    .join("/");

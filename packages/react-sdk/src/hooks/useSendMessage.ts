import type { Conversation, SendOptions } from "@xmtp/xmtp-js";
import { useCallback } from "react";

/**
 * This hook sends a message into a conversation.
 */
export const useSendMessage = <T = string>(conversation?: Conversation) =>
  useCallback(
    async (message: T, options?: SendOptions) => {
      await conversation?.send(message, options);
    },
    [conversation],
  );

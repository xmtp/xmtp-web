import type { Conversation, SendOptions } from "@xmtp/xmtp-js";
import { useCallback } from "react";

/**
 * This hook sends a new message into a conversation.
 */
export const useSendMessage = <T = string>(
  conversation: Conversation,
  options?: SendOptions,
) =>
  useCallback(
    async (message: T, optionsOverride?: SendOptions) => {
      await conversation?.send(message, optionsOverride || options);
    },
    [conversation, options],
  );

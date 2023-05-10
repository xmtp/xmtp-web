import type { Conversation, SendOptions } from "@xmtp/xmtp-js";
import { useCallback } from "react";

/**
 * This hook sends a new message into a conversation.
 */
export const useSendMessage = <T = string>(
  conversation: Conversation,
  options?: SendOptions,
) => {
  // destructure options for more granular dependency array
  const { compression, contentFallback, contentType, ephemeral, timestamp } =
    options ?? {};

  return useCallback(
    async (message: T, optionsOverride?: SendOptions) => {
      await conversation?.send(
        message,
        optionsOverride ?? {
          compression,
          contentFallback,
          contentType,
          ephemeral,
          timestamp,
        },
      );
    },
    [
      compression,
      contentFallback,
      contentType,
      conversation,
      ephemeral,
      timestamp,
    ],
  );
};

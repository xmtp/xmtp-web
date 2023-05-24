import type { Conversation, SendOptions } from "@xmtp/xmtp-js";
import { useCallback, useState } from "react";
import type { OnError } from "../sharedTypes";

export type UseSendMessageOptions = SendOptions & OnError;

/**
 * This hook sends a new message into a conversation.
 */
export const useSendMessage = <T = string>(
  conversation: Conversation,
  options?: UseSendMessageOptions,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // destructure options for more granular dependency array
  const {
    compression,
    contentFallback,
    contentType,
    ephemeral,
    onError,
    timestamp,
  } = options ?? {};

  const sendMessage = useCallback(
    async (message: T, optionsOverride?: SendOptions) => {
      setIsLoading(true);
      setError(null);

      try {
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
      } catch (e) {
        setError(e);
        onError?.(e);
        // re-throw error for upstream consumption
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [
      compression,
      contentFallback,
      contentType,
      conversation,
      ephemeral,
      onError,
      timestamp,
    ],
  );

  return {
    error,
    isLoading,
    sendMessage,
  };
};

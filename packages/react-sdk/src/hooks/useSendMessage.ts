import type { Conversation, DecodedMessage, SendOptions } from "@xmtp/xmtp-js";
import { useCallback, useState } from "react";
import type { OnError } from "../sharedTypes";
import messagesDb from "../helpers/messagesDb";

export type UseSendMessageOptions = SendOptions &
  OnError & {
    /**
     * Callback function to execute when a message has been sent successfully
     */
    onSuccess?: (message: DecodedMessage) => void;
    /**
     * Automatically persist a successfully sent message to messages DB cache
     */
    persist?: boolean;
  };

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
    onSuccess,
    persist,
    timestamp,
  } = options ?? {};

  const sendMessage = useCallback(
    async (message: T, optionsOverride?: SendOptions) => {
      setIsLoading(true);
      setError(null);

      try {
        const sentMessage = await conversation?.send(
          message,
          optionsOverride ?? {
            compression,
            contentFallback,
            contentType,
            ephemeral,
            timestamp,
          },
        );
        onSuccess?.(sentMessage);
        if (persist) {
          await messagesDb.persistMessage(sentMessage);
        }
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
      onSuccess,
      persist,
      timestamp,
    ],
  );

  return {
    error,
    isLoading,
    sendMessage,
  };
};

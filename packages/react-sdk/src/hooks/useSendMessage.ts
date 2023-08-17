import type { ContentTypeId, DecodedMessage, SendOptions } from "@xmtp/xmtp-js";
import { useCallback, useState } from "react";
import type { OnError } from "../sharedTypes";
import { type CachedConversation } from "@/helpers/caching/conversations";
import { useMessage } from "@/hooks/useMessage";

export type UseSendMessageOptions = OnError & {
  /**
   * Callback function to execute when a message has been sent successfully
   */
  onSuccess?: (message: DecodedMessage) => void;
};

/**
 * This hook sends a new message into a conversation
 */
export const useSendMessage = (options?: UseSendMessageOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { sendMessage: _sendMessage } = useMessage();

  // destructure options for more granular dependency array
  const { onError, onSuccess } = options ?? {};

  const sendMessage = useCallback(
    async <T = string>(
      conversation: CachedConversation,
      content: T,
      contentType?: ContentTypeId,
      sendOptions?: Omit<SendOptions, "contentType">,
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const { sentMessage } = await _sendMessage(
          conversation,
          content,
          contentType,
          {
            ...sendOptions,
            onSuccess,
            onError,
          },
        );

        return sentMessage;
      } catch (e) {
        setError(e as Error);
        // re-throw error for upstream consumption
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [_sendMessage, onError, onSuccess],
  );

  return {
    error,
    isLoading,
    sendMessage,
  };
};

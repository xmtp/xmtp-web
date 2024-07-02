import { useCallback, useState } from "react";
import type { InvitationContext } from "@xmtp/xmtp-js";
import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { useClient } from "./useClient";
import type { OnError } from "../sharedTypes";
import type { SendMessageOptions } from "@/hooks/useMessage";
import { useConversationInternal } from "@/hooks/useConversation";
import { useMessage } from "@/hooks/useMessage";
import { toCachedConversation } from "@/helpers/caching/conversations";

export type UseStartConversation = Partial<InvitationContext> & OnError;

/**
 * This hook starts a new conversation and sends an initial message to it.
 */
export const useStartConversation = (options?: UseStartConversation) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useClient();
  const { sendMessage: _sendMessage } = useMessage();
  const { saveConversation } = useConversationInternal();

  // destructure options for more granular dependency arrays
  const { conversationId, metadata, onError } = options ?? {};

  const startConversation = useCallback(
    async <T = string>(
      peerAddress: string,
      content: T,
      contentType?: ContentTypeId,
      sendOptions?: SendMessageOptions,
    ) => {
      // we can't do anything without a client
      if (client === undefined) {
        const clientError = new Error(
          "XMTP client is required to start a conversation",
        );
        setError(clientError);
        onError?.(clientError);
        return {
          cachedConversation: undefined,
          cachedMessage: undefined,
          conversation: undefined,
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        const conversation = await client.conversations.newConversation(
          peerAddress,
          conversationId && metadata
            ? {
                conversationId,
                metadata,
              }
            : undefined,
        );

        const cachedConversation = await saveConversation(
          toCachedConversation(conversation, client.address),
        );

        if (!cachedConversation) {
          return {
            cachedConversation: undefined,
            cachedMessage: undefined,
            conversation,
          };
        }

        if (content === undefined) {
          return {
            cachedConversation,
            cachedMessage: undefined,
            conversation,
          };
        }

        const { cachedMessage } = await _sendMessage(
          cachedConversation,
          content,
          contentType,
          sendOptions,
        );

        return {
          cachedConversation,
          cachedMessage,
          conversation,
        };
      } catch (e) {
        setError(e as Error);
        onError?.(e as Error);
        // re-throw error for upstream consumption
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [_sendMessage, client, conversationId, metadata, onError, saveConversation],
  );

  return {
    error,
    isLoading,
    startConversation,
  };
};

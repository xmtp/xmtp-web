import { useCallback, useState } from "react";
import type { SendOptions, InvitationContext } from "@xmtp/xmtp-js";
import { useClient } from "./useClient";
import type { OnError } from "../sharedTypes";

export type UseStartConversation = InvitationContext & OnError;

/**
 * This hook starts a new conversation and sends an initial message to it.
 */
export const useStartConversation = <T = string>(
  options?: UseStartConversation,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | Error | null>(null);
  const { client } = useClient();

  // destructure options for more granular dependency arrays
  const { conversationId, metadata, onError } = options ?? {};

  const startConversation = useCallback(
    async (peerAddress: string, message: T, sendOptions?: SendOptions) => {
      // we can't do anything without a client
      if (client === undefined) {
        const clientError = new Error("XMTP client is not available");
        setError(clientError);
        onError?.(client);
        // do not throw the error in this case
        // return undefined
        return undefined;
      }

      setIsLoading(true);
      setError(null);

      try {
        const conversation = await client?.conversations.newConversation(
          peerAddress,
          conversationId && metadata
            ? {
                conversationId,
                metadata,
              }
            : undefined,
        );

        await conversation.send(message, sendOptions);
        return conversation;
      } catch (e) {
        setError(e);
        onError?.(e);
        // re-throw error for upstream consumption
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [client, conversationId, metadata, onError],
  );

  return {
    error,
    isLoading,
    startConversation,
  };
};

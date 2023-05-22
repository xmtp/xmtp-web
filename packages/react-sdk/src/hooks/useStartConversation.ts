import { useCallback } from "react";
import type { SendOptions, InvitationContext } from "@xmtp/xmtp-js";
import { useClient } from "./useClient";

/**
 * This hook starts a new conversation and sends an initial message to it.
 */
export const useStartConversation = <T = string>(
  options?: InvitationContext,
) => {
  const { client } = useClient();

  // destructure options for more granular dependency arrays
  const { conversationId, metadata } = options ?? {};

  return useCallback(
    async (peerAddress: string, message: T, sendOptions?: SendOptions) => {
      // we can't do anything without a client
      if (client === undefined) {
        console.error("XMTP client is not available");
        return undefined;
      }

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
    },
    [conversationId, metadata, client],
  );
};

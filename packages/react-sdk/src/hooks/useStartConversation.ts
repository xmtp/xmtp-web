import type { InvitationContext } from "@xmtp/xmtp-js/dist/types/src/Invitation";
import { useCallback, useContext } from "react";
import type { SendOptions } from "@xmtp/xmtp-js";
import { XMTPContext } from "../contexts/XMTPContext";

/**
 * This hook starts a new conversation and sends an initial message to it.
 */
export const useStartConversation = <T = string>(
  options?: InvitationContext,
) => {
  const xmtpContext = useContext(XMTPContext);
  if (xmtpContext === undefined) {
    console.error("useStartConversation must be used within a XMTPProvider");
  }

  return useCallback(
    async (peerAddress: string, message: T, sendOptions?: SendOptions) => {
      // we can't do anything without a client
      if (xmtpContext?.client === undefined) {
        console.error("XMTP client is not available");
        return undefined;
      }

      const conversation =
        await xmtpContext?.client?.conversations.newConversation(
          peerAddress,
          options,
        );

      await conversation.send(message, sendOptions);

      return conversation;
    },
    [options, xmtpContext?.client],
  );
};

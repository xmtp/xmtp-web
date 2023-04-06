import type { Conversation } from "@xmtp/xmtp-js";
import { useContext, useEffect, useState } from "react";
import { XMTPContext } from "../contexts/XMTPContext";

/**
 * This hook fetches all conversations with the current wallet on mount.
 * It also exposes error and loading states.
 */
export const useConversations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const xmtpContext = useContext(XMTPContext);
  if (xmtpContext === undefined) {
    console.error("useConversations must be used within a XMTPProvider");
  }

  // attempt to fetch conversations on mount
  useEffect(() => {
    // we can't do anything without a client
    if (xmtpContext?.client === undefined) {
      console.error("XMTP client is not available");
      return;
    }

    const getConversations = async () => {
      setIsLoading(true);

      try {
        const conversationList =
          (await xmtpContext.client?.conversations.list()) ?? [];
        setConversations(conversationList);
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };

    void getConversations();
  }, [xmtpContext?.client]);

  return {
    conversations,
    error,
    isLoading,
  };
};

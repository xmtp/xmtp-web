import type { Conversation } from "@xmtp/xmtp-js";
import { useContext, useEffect, useState } from "react";
import { XMTPContext } from "../contexts/XMTPContext";

export type UseConversationsOptions = {
  /**
   * Callback function to execute when new conversations are fetched
   */
  onConversations?: (conversations: Conversation[]) => void;
  /**
   * Callback function to execute when an error occurs
   */
  onError?: (error: unknown) => void;
};

/**
 * This hook fetches all conversations with the current wallet on mount.
 * It also exposes error and loading states.
 */
export const useConversations = (options?: UseConversationsOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // destructure options for more granular dependency arrays
  const { onConversations, onError } = options ?? {};

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
        onConversations?.(conversationList);
      } catch (e) {
        setError(e);
        onError?.(e);
      } finally {
        setIsLoading(false);
      }
    };

    void getConversations();
  }, [onConversations, onError, xmtpContext.client]);

  return {
    conversations,
    error,
    isLoading,
  };
};

import type {
  Conversation,
  DecodedMessage,
  ListMessagesOptions,
} from "@xmtp/xmtp-js";
import { useEffect, useState } from "react";

/**
 * This hook fetches a list of all messages within a conversation on mount. It
 * also exposes loading and error states and whether or not there are more
 * messages based on the options passed.
 */
export const useMessages = (
  conversation?: Conversation,
  options?: ListMessagesOptions,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [messages, setMessages] = useState<DecodedMessage[]>([]);

  // attempt to fetch conversation messages on mount
  useEffect(() => {
    const getMessages = async () => {
      // we must have a conversation first
      if (!conversation) {
        return;
      }

      setIsLoading(true);

      try {
        const newMessages = await conversation.messages(options);
        setMessages(newMessages);
        if (newMessages.length > 0) {
          setHasMore(newMessages.length < (options?.limit ?? 0));
        }
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };

    void getMessages();
  }, [conversation, options]);

  return {
    error,
    isLoading,
    messages,
    hasMore,
  };
};

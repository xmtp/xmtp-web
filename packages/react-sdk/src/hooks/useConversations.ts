import { SortDirection, type Conversation } from "@xmtp/xmtp-js";
import { useEffect, useRef, useState } from "react";
import { useClient } from "./useClient";
import type { OnError } from "../sharedTypes";
import { useCachedConversations } from "./useCachedConversations";
import { toCachedMessage } from "@/helpers/caching/messages";
import {
  useConversation,
  useConversationInternal,
} from "@/hooks/useConversation";
import { useMessage } from "@/hooks/useMessage";
import { toCachedConversation } from "@/helpers/caching/conversations";

export type UseConversationsOptions = OnError & {
  /**
   * Callback function to execute when new conversations are fetched
   */
  onConversations?: (conversations: Conversation[]) => void;
};

/**
 * This hook fetches all conversations with the current wallet on mount.
 * It also exposes error and loading states.
 */
export const useConversations = (options?: UseConversationsOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useClient();
  const { processMessage } = useMessage();
  const { saveConversation } = useConversationInternal();
  const { hasConversationTopic } = useConversation();
  const conversations = useCachedConversations();
  // to prevent conversations from being fetched multiple times
  const loadingRef = useRef(false);

  // destructure options for more granular dependency arrays
  const { onConversations, onError } = options ?? {};

  // attempt to fetch conversations on mount
  useEffect(() => {
    // client is required
    if (!client) {
      const clientError = new Error(
        "XMTP client is required to fetch conversations",
      );
      setError(clientError);
      onError?.(clientError);
      // do not throw the error in this case
      return;
    }

    const getConversations = async () => {
      // already in progress
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;

      setIsLoading(true);
      setIsLoaded(false);
      setError(null);

      try {
        const conversationList = (await client.conversations.list()) ?? [];
        await Promise.all(
          conversationList.map(async (conversation) => {
            // only save the conversation and fetch its latest message if it
            // doesn't already exist
            if (!(await hasConversationTopic(conversation.topic))) {
              const cachedConversation = await saveConversation(
                toCachedConversation(conversation, client.address),
              );

              // fetch the latest message for each conversation
              const latestMessages = await conversation.messages({
                direction: SortDirection.SORT_DIRECTION_DESCENDING,
                limit: 1,
              });

              if (latestMessages.length > 0 && cachedConversation) {
                const latestMessage = latestMessages[0];
                await processMessage(
                  cachedConversation,
                  toCachedMessage(latestMessage, client.address),
                );
              }
            }
          }),
        );
        setIsLoaded(true);
        onConversations?.(conversationList);
      } catch (e) {
        setError(e as Error);
        onError?.(e as Error);
        // re-throw error for upstream consumption
        throw e;
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    void getConversations();
  }, [
    client,
    hasConversationTopic,
    onConversations,
    onError,
    processMessage,
    saveConversation,
  ]);

  return {
    conversations,
    error,
    isLoaded,
    isLoading,
  };
};

import { SortDirection, type DecodedMessage } from "@xmtp/xmtp-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { min, subSeconds } from "date-fns";
import type { OnError } from "../sharedTypes";
import { useCachedMessages } from "./useCachedMessages";
import { toCachedMessage } from "@/helpers/caching/messages";
import { getConversationByTopic } from "@/helpers/caching/conversations";
import type { CachedConversation } from "@/helpers/caching/conversations";
import { useClient } from "./useClient";
import { useConversationInternal } from "@/hooks/useConversation";
import { useMessage } from "@/hooks/useMessage";

export type UseMessagesOptions = OnError & {
  /**
   * Callback function to execute when new messages are fetched
   */
  onMessages?: (messages: DecodedMessage[]) => void;
  /**
   * Whether or not to disable automatic syncing of messages when the
   * browser tab becomes visible
   */
  disableAutoSync?: boolean;
};

/**
 * This hook fetches a list of all messages within a conversation on mount. It
 * also exposes loading and error states and whether or not there are more
 * messages based on the options passed.
 */
export const useMessages = (
  conversation: CachedConversation,
  options?: UseMessagesOptions,
) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { processMessage } = useMessage();
  const { updateConversation } = useConversationInternal();
  const messages = useCachedMessages(conversation.topic);
  const { client } = useClient();
  // to prevent messages from being fetched multiple times
  const loadingRef = useRef(false);

  // destructure options for more granular dependency arrays
  const { disableAutoSync, onError, onMessages } = options ?? {};

  const getMessages = useCallback(async () => {
    // already in progress
    if (loadingRef.current) {
      return;
    }

    // client is required
    if (!client) {
      const clientError = new Error("XMTP client is not available");
      setError(clientError);
      onError?.(clientError);
      return;
    }

    loadingRef.current = true;

    // reset loading states
    setIsLoading(true);
    setIsLoaded(false);
    // reset error state
    setError(null);

    // fetch messages from the network starting from this time
    let startTime: Date | undefined;

    // if the conversation messages have already been loaded
    if (conversation.isReady) {
      /**
       * the time of the latest message in the conversation may come after the
       * last time the conversation was synced. in this case, we want to fetch
       * messages after the last sync to ensure no messages are missed.
       */
      const syncFrom = min([
        // if the conversation is ready, `lastSyncedAt` should be defined
        conversation.lastSyncedAt ?? Date.now(),
        conversation.updatedAt,
      ]);
      // account for clock drift
      startTime = subSeconds(syncFrom, 10);
    }

    try {
      const networkConversation = await getConversationByTopic(
        conversation.topic,
        client,
      );

      // message timestamps are user-generated and can't be trusted to
      // determine the last synced time
      const lastSyncedAt = new Date();

      const networkMessages =
        (await networkConversation?.messages({
          // be explicit in case the default changes
          direction: SortDirection.SORT_DIRECTION_ASCENDING,
          startTime,
        })) ?? [];

      await Promise.all(
        networkMessages.map((message) =>
          processMessage(
            conversation,
            toCachedMessage(message, client.address),
          ),
        ),
      );

      // this is the first time the conversation messages have been loaded
      if (!conversation.isReady) {
        // mark the conversation as ready
        await updateConversation(conversation.topic, { isReady: true });
      }

      // update the conversation's last synced time
      await updateConversation(conversation.topic, {
        lastSyncedAt,
      });

      setIsLoaded(true);
      onMessages?.(networkMessages);
    } catch (e) {
      setError(e as Error);
      onError?.(e as Error);
      // re-throw error for upstream consumption
      throw e;
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [
    client,
    conversation,
    onError,
    onMessages,
    processMessage,
    updateConversation,
  ]);

  // fetch conversation messages on mount
  useEffect(() => {
    void getMessages();
  }, [getMessages]);

  // fetch conversation messages when the page becomes visible
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden && !disableAutoSync) {
        void getMessages();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [getMessages, disableAutoSync]);

  return {
    error,
    isLoaded,
    isLoading,
    messages,
  };
};

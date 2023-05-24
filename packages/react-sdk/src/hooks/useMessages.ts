import type {
  Conversation,
  DecodedMessage,
  ListMessagesOptions,
} from "@xmtp/xmtp-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateLastEntry } from "../helpers/updateLastEntry";
import type { OnError } from "../sharedTypes";

export type UseMessagesOptions = ListMessagesOptions &
  OnError & {
    /**
     * Callback function to execute when new messages are fetched
     */
    onMessages?: (
      messages: DecodedMessage[],
      options: ListMessagesOptions,
    ) => void;
  };

/**
 * This hook fetches a list of all messages within a conversation on mount. It
 * also exposes loading and error states and whether or not there are more
 * messages based on the options passed.
 */
export const useMessages = (
  conversation?: Conversation,
  options?: UseMessagesOptions,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  // internal references to start/end times for paging results
  const startTimeRef = useRef<Date | undefined>(options?.startTime);
  const endTimeRef = useRef<Date | undefined>(options?.endTime);
  // internal reference to the last message fetched
  const lastEntryRef = useRef<DecodedMessage | undefined>();

  // destructure options for more granular dependency arrays
  const {
    checkAddresses,
    direction,
    limit,
    onError,
    onMessages,
    endTime,
    startTime,
  } = options ?? {};

  // reset start/end time refs when the options or conversation change
  useEffect(() => {
    startTimeRef.current = startTime;
    endTimeRef.current = endTime;
  }, [endTime, startTime, conversation]);

  // reset messages when the conversation changes
  useEffect(() => {
    setMessages([]);
  }, [conversation]);

  const getMessages = useCallback(async () => {
    // conversation is required
    if (!conversation) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    const finalOptions = {
      checkAddresses,
      direction,
      endTime: endTimeRef.current,
      limit,
      startTime: startTimeRef.current,
    };

    try {
      const networkMessages = await conversation.messages(finalOptions);

      if (networkMessages.length > 0) {
        updateLastEntry({
          direction,
          endTimeRef,
          startTimeRef,
          lastEntry: networkMessages[networkMessages.length - 1],
          lastEntryRef,
        });
      }

      setMessages(networkMessages);
      onMessages?.(networkMessages, finalOptions);

      if (limit) {
        setHasMore(
          networkMessages.length > 0 && networkMessages.length === limit,
        );
      }

      return networkMessages;
    } catch (e) {
      setError(e);
      onError?.(e);
      // re-throw error for upstream consumption
      throw e;
    } finally {
      setIsLoading(false);
    }

    return [];
  }, [checkAddresses, conversation, direction, limit, onError, onMessages]);

  // fetch the next set of messages
  const next = useCallback(async () => getMessages(), [getMessages]);

  // fetch conversation messages on mount
  useEffect(() => {
    void getMessages();
  }, [getMessages]);

  return {
    error,
    hasMore,
    isLoading,
    messages,
    next,
  };
};

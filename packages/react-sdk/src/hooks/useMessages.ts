import type {
  Conversation,
  DecodedMessage,
  ListMessagesOptions,
} from "@xmtp/xmtp-js";
import { SortDirection } from "@xmtp/xmtp-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { adjustDate } from "../helpers/adjustDate";

export type UseMessagesOptions = ListMessagesOptions & {
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

  // // reset start/end time refs when the options change
  useEffect(() => {
    startTimeRef.current = options?.startTime;
    endTimeRef.current = options?.endTime;
  }, [options]);

  // reset messages when the conversation changes
  useEffect(() => {
    setMessages([]);
  }, [conversation]);

  // fetch the next set of messages based on passed options
  const next = useCallback(async () => {
    // limit is required for paging
    if (conversation && options?.limit && hasMore && messages.length > 0) {
      const { onMessages, direction, ...otherOptions } = options;

      const lastMessageSentAt = messages[messages.length - 1].sent;

      // update start/end times based on sort direction
      switch (direction) {
        case SortDirection.SORT_DIRECTION_UNSPECIFIED:
        case SortDirection.SORT_DIRECTION_ASCENDING:
          startTimeRef.current = adjustDate(lastMessageSentAt, 1);
          break;
        case SortDirection.SORT_DIRECTION_DESCENDING:
          endTimeRef.current = adjustDate(lastMessageSentAt, -1);
          break;
        // no default
      }

      // fetch next batch of messages
      setIsLoading(true);
      try {
        const nextMessages = await conversation.messages({
          ...otherOptions,
          direction,
          endTime: endTimeRef.current,
          startTime: startTimeRef.current,
        });
        onMessages?.(nextMessages, otherOptions);
        setMessages(nextMessages);
        setHasMore(
          nextMessages.length > 0 && nextMessages.length === options.limit,
        );
        return nextMessages;
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }
    return [];
  }, [conversation, hasMore, messages, options]);

  // fetch conversation messages on mount
  useEffect(() => {
    const getMessages = async () => {
      // conversation is required
      if (!conversation) {
        return;
      }
      setIsLoading(true);
      try {
        const newMessages = await conversation.messages(options);
        setMessages(newMessages);
        options?.onMessages?.(newMessages, options);
        if (options?.limit) {
          setHasMore(
            newMessages.length > 0 && newMessages.length === options.limit,
          );
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
    hasMore,
    isLoading,
    messages,
    next,
  };
};

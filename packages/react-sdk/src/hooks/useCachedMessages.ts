import type { Client, Conversation, ListMessagesOptions } from "@xmtp/xmtp-js";
import { DecodedMessage, SortDirection } from "@xmtp/xmtp-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Collection, IndexableType } from "dexie";
import type { CachedMessage } from "../helpers/messageDb";
import { messagesDb } from "../helpers/messageDb";
import { getConversationId } from "../helpers/getConversationId";
import { useClient } from "./useClient";
import { updateLastEntry } from "../helpers/updateLastEntry";

const filterByConversation = (cId: string) => (cachedMessage: CachedMessage) =>
  cachedMessage.cId === cId;

const fastForward = (lastEntry: DecodedMessage | undefined, cId: string) => {
  let fastForwardComplete = false;
  return (item: CachedMessage) => {
    if (fastForwardComplete) {
      return item.cId === cId;
    }
    if (lastEntry !== undefined && item.id === lastEntry.id) {
      fastForwardComplete = true;
    }
    return false;
  };
};

type GetCachedMessagesOptions = {
  cId: string;
  client: Client;
  direction?: string;
  initial?: boolean;
  lastEntry?: DecodedMessage;
  limit?: number;
};

const getCachedMessages = async ({
  cId,
  client,
  direction,
  initial,
  lastEntry,
  limit,
}: GetCachedMessagesOptions) => {
  let messagesQuery: Collection<CachedMessage, IndexableType>;

  if (initial) {
    messagesQuery = messagesDb.messages
      .orderBy("sent")
      .filter(filterByConversation(cId));
  } else {
    messagesQuery = messagesDb.messages
      .where("sent")
      .aboveOrEqual(lastEntry?.sent)
      .filter(fastForward(lastEntry, cId));
  }

  // apply limit
  if (limit) {
    messagesQuery = messagesQuery.limit(limit);
  }

  // apply sorting
  if (direction === SortDirection.SORT_DIRECTION_DESCENDING) {
    messagesQuery = messagesQuery.reverse();
  }

  const cachedMessages = await messagesQuery.toArray();

  // decode cached messages
  return Promise.all(
    cachedMessages.map(async (m) => DecodedMessage.fromBytes(m.bytes, client)),
  );
};

export type UseCachedMessagesOptions = ListMessagesOptions & {
  /**
   * Callback function to execute when new messages are fetched
   */
  onMessages?: (
    messages: DecodedMessage[],
    options: ListMessagesOptions,
  ) => void;
  /**
   * Callback function to execute when an error occurs
   */
  onError?: (error: unknown) => void;
};

/**
 * This hook fetches a list of all messages within a conversation on mount,
 * backed by a cache stored in IndexedDB. Like the `useMessages` hook, it also
 * exposes loading and error states and whether or not there are more messages
 * based on the options passed.
 */
export const useCachedMessages = (
  conversation?: Conversation,
  options?: UseCachedMessagesOptions,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const { client } = useClient();
  // internal references to start/end times for paging results
  const startTimeRef = useRef<Date | undefined>(options?.startTime);
  const endTimeRef = useRef<Date | undefined>(options?.endTime);
  // internal reference to the last entry in the cache
  const lastCacheEntryRef = useRef<DecodedMessage | undefined>();

  // destructure options for more granular dependency arrays
  const {
    checkAddresses,
    direction,
    limit,
    onError,
    onMessages,
    startTime,
    endTime,
  } = options ?? {};

  // reset start/end time refs when the options or conversation change
  useEffect(() => {
    startTimeRef.current = startTime;
    endTimeRef.current = endTime;
  }, [endTime, startTime, conversation]);

  const getMessages = useCallback(
    async (initial?: boolean) => {
      // client and conversation are required
      if (!client || !conversation) {
        return;
      }

      const cId = getConversationId(conversation);

      try {
        // get cached messages and decode them
        const decodedMessages = await getCachedMessages({
          cId,
          client,
          direction,
          initial,
          lastEntry: lastCacheEntryRef.current,
          limit,
        });

        setMessages(decodedMessages);

        updateLastEntry({
          direction,
          endTimeRef,
          startTimeRef,
          lastEntry: decodedMessages[decodedMessages.length - 1],
          lastEntryRef: lastCacheEntryRef,
        });

        // only fetch more messages from the network if necessary
        // no limit specified, or
        // number of cached messages is less than the limit
        if (!(!limit || (limit && decodedMessages.length < limit))) {
          return;
        }

        let finalLimit = limit;
        if (limit && decodedMessages.length < limit) {
          finalLimit = limit - decodedMessages.length;
        }

        const finalOptions = {
          checkAddresses,
          direction,
          endTime: endTimeRef.current,
          limit: finalLimit,
          startTime: startTimeRef.current,
        };

        setIsLoading(true);

        const networkMessages = await conversation.messages(finalOptions);

        networkMessages.forEach((m) => {
          void messagesDb.persistMessage(m);
        });

        if (networkMessages.length > 0) {
          updateLastEntry({
            direction,
            endTimeRef,
            startTimeRef,
            lastEntry: networkMessages[networkMessages.length - 1],
            lastEntryRef: lastCacheEntryRef,
          });
        }

        const newMessages: DecodedMessage[] = [
          ...decodedMessages,
          ...networkMessages,
        ];

        setMessages(newMessages);
        onMessages?.(newMessages, finalOptions);

        if (limit) {
          setHasMore(newMessages.length > 0 && newMessages.length === limit);
        }
      } catch (e) {
        setError(e);
        onError?.(e);
      } finally {
        setIsLoading(false);
      }
    },
    [
      checkAddresses,
      client,
      conversation,
      direction,
      limit,
      onError,
      onMessages,
    ],
  );

  // fetch the next set of messages
  const next = useCallback(async () => getMessages(), [getMessages]);

  // fetch conversation messages on mount
  useEffect(() => {
    void getMessages(true);
  }, [getMessages]);

  return {
    error,
    hasMore,
    isLoading,
    messages,
    next,
  };
};

import type { Client, Conversation, ListMessagesOptions } from "@xmtp/xmtp-js";
import { DecodedMessage, SortDirection } from "@xmtp/xmtp-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dexie, type Collection, type IndexableType } from "dexie";
import type { CachedMessage } from "../helpers/messagesDb";
import messagesDb from "../helpers/messagesDb";
import { getConversationId } from "../helpers/getConversationId";
import { useClient } from "./useClient";
import { updateLastEntry } from "../helpers/updateLastEntry";
import { adjustDate } from "../helpers/adjustDate";
import type { OnError } from "../sharedTypes";

type GetCachedMessagesOptions = {
  /**
   * Conversation ID
   */
  cId: string;
  /**
   * XMTP client, needed for decryption
   */
  client: Client;
  /**
   * Sort direction
   */
  direction?: string;
  /**
   * Is this the initial fetch?
   */
  initial?: boolean;
  /**
   * The position of the cursor
   */
  lastEntry?: DecodedMessage;
  /**
   * Page size
   */
  limit?: number;
};

// fetch messages from the cache and decode them
const getCachedMessages = async ({
  cId,
  client,
  direction,
  initial,
  lastEntry,
  limit,
}: GetCachedMessagesOptions) => {
  let messagesQuery: Collection<CachedMessage, IndexableType>;

  messagesQuery = messagesDb.messages
    // order by conversation ID, then sent timestamp
    .where("[cId+sent]")
    // only fetch messages that match the current conversation ID
    .between(
      [
        cId,
        initial
          ? // initially, get all messages
            Dexie.minKey
          : lastEntry?.sent
          ? // when paging through messages, only fetch messages sent after
            // the current latest entry
            adjustDate(lastEntry.sent, 1)
          : 0,
      ],
      [cId, Dexie.maxKey],
    );

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

export type UseCachedMessagesOptions = ListMessagesOptions &
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
      setError(null);

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
        // re-throw error for upstream consumption
        throw e;
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

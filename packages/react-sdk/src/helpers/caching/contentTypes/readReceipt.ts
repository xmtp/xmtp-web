import {
  ReadReceiptCodec,
  ContentTypeReadReceipt,
} from "@xmtp/content-type-read-receipt";
import { ContentTypeId } from "@xmtp/xmtp-js";
import { z } from "zod";
import { isAfter, parseISO } from "date-fns";
import { Mutex } from "async-mutex";
import type {
  ContentTypeConfiguration,
  ContentTypeMessageProcessor,
  ContentTypeMetadataValues,
} from "../db";
import {
  getCachedConversationByTopic,
  type CachedConversation,
} from "../conversations";

const NAMESPACE = "readReceipt";

export type CachedReadReceiptMetadata = {
  incoming: string | undefined;
  outgoing: string | undefined;
};

/**
 * Retrieve the read receipt from a cached conversation for the given type
 *
 * @param conversation Cached conversation
 * @returns The read receipt date, or `undefined` if the conversation
 * has no read receipt for the given type
 */
export const getReadReceipt = (
  conversation: CachedConversation,
  type: keyof CachedReadReceiptMetadata,
) => {
  const metadata = conversation?.metadata?.[NAMESPACE] as
    | CachedReadReceiptMetadata
    | undefined;
  const readReceiptType = metadata?.[type];
  return readReceiptType ? parseISO(readReceiptType) : undefined;
};

/**
 * Check if a cached conversation has a read receipt for the given type
 *
 * @param conversation Cached conversation
 * @returns `true` if the conversation has a read receipt for the given type,
 * `false` otherwise
 */
export const hasReadReceipt = (
  conversation: CachedConversation,
  type: keyof CachedReadReceiptMetadata,
) => getReadReceipt(conversation, type) !== undefined;

const ReadReceiptContentSchema = z.object({}).strict();

/**
 * Validate the content of a read receipt message
 *
 * @param content Message content
 * @returns `true` if the content is valid, `false` otherwise
 */
const isValidReadReceiptContent = (content: unknown) => {
  const { success } = ReadReceiptContentSchema.safeParse(content);
  return success;
};

const processReadReceiptMutex = new Mutex();

/**
 * Process a read receipt message
 *
 * Updates the metadata of its conversation with the timestamp of the
 * read receipt.
 */
export const processReadReceipt: ContentTypeMessageProcessor = async ({
  client,
  db,
  message,
  conversation,
  updateConversationMetadata,
}) => {
  // ensure that only 1 read receipt message is processed at a time to preserve order
  await processReadReceiptMutex.runExclusive(async () => {
    const contentType = ContentTypeId.fromString(message.contentType);
    // always use the latest conversation from the cache
    const updatedConversation = await getCachedConversationByTopic(
      client.address,
      conversation.topic,
      db,
    );
    if (updatedConversation) {
      const isIncoming = message.senderAddress !== client.address;
      const readReceiptType = isIncoming ? "incoming" : "outgoing";
      const readReceiptDate = getReadReceipt(
        updatedConversation,
        readReceiptType,
      );
      if (
        ContentTypeReadReceipt.sameAs(contentType) &&
        conversation &&
        isValidReadReceiptContent(message.content) &&
        // ignore read receipts that are older than the current one
        (!readReceiptDate || isAfter(message.sentAt, readReceiptDate))
      ) {
        const metadata = updatedConversation.metadata?.[NAMESPACE] as
          | CachedReadReceiptMetadata
          | undefined;
        // update conversation metadata with the appropriate read receipt
        await updateConversationMetadata({
          ...(metadata ?? {}),
          [readReceiptType]: message.sentAt.toISOString(),
        } as ContentTypeMetadataValues);
      }
    }
  });
};

export const readReceiptContentTypeConfig: ContentTypeConfiguration = {
  codecs: [new ReadReceiptCodec()],
  contentTypes: [ContentTypeReadReceipt.toString()],
  namespace: NAMESPACE,
  processors: {
    [ContentTypeReadReceipt.toString()]: [processReadReceipt],
  },
  validators: {
    [ContentTypeReadReceipt.toString()]: isValidReadReceiptContent,
  },
};

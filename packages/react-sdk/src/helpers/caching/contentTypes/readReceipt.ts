import {
  ReadReceiptCodec,
  ContentTypeReadReceipt,
} from "@xmtp/content-type-read-receipt";
import { ContentTypeId } from "@xmtp/xmtp-js";
import { z } from "zod";
import { isAfter, parseISO } from "date-fns";
import type {
  ContentTypeConfiguration,
  ContentTypeMessageProcessor,
} from "../db";
import type { CachedConversation } from "../conversations";

const NAMESPACE = "readReceipt";

export type CachedReadReceiptMetadata = string | undefined;

/**
 * Retrieve the read receipt from a cached conversation
 *
 * @param conversation Cached conversation
 * @returns The read receipt date, or `undefined` if the conversation
 * has no read receipt
 */
export const getReadReceipt = (conversation: CachedConversation) => {
  const metadata = conversation?.metadata?.[
    NAMESPACE
  ] as CachedReadReceiptMetadata;
  return metadata ? parseISO(metadata) : undefined;
};

/**
 * Check if a cached conversation has a read receipt
 *
 * @param conversation Cached conversation
 * @returns `true` if the conversation has a read receipt, `false` otherwise
 */
export const hasReadReceipt = (conversation: CachedConversation) =>
  getReadReceipt(conversation) !== undefined;

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

/**
 * Process a read receipt message
 *
 * Updates the metadata of its conversation with the timestamp of the
 * read receipt.
 */
export const processReadReceipt: ContentTypeMessageProcessor = async ({
  client,
  message,
  conversation,
  updateConversationMetadata,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  const readReceiptDate = getReadReceipt(conversation);
  if (
    ContentTypeReadReceipt.sameAs(contentType) &&
    conversation &&
    isValidReadReceiptContent(message.content) &&
    // ignore read receipts sent by the client
    message.senderAddress !== client.address &&
    // ignore read receipts that are older than the current one
    (!readReceiptDate || isAfter(message.sentAt, readReceiptDate))
  ) {
    // update message's conversation with the message timestamp
    await updateConversationMetadata(message.sentAt.toISOString());
  }
};

export const readReceiptContentTypeConfig: ContentTypeConfiguration = {
  codecs: [new ReadReceiptCodec()],
  namespace: NAMESPACE,
  processors: {
    [ContentTypeReadReceipt.toString()]: [processReadReceipt],
  },
  validators: {
    [ContentTypeReadReceipt.toString()]: isValidReadReceiptContent,
  },
};

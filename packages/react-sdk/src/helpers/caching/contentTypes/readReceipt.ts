import type { ReadReceipt } from "@xmtp/content-type-read-receipt";
import {
  ReadReceiptCodec,
  ContentTypeReadReceipt,
} from "@xmtp/content-type-read-receipt";
import { ContentTypeId } from "@xmtp/xmtp-js";
import { parseISO } from "date-fns";
import type { CacheConfiguration, CachedMessageProcessor } from "../db";
import type { CachedConversation } from "../conversations";

const NAMESPACE = "readReceipt";

export type CachedReadReceiptMetadata = string | undefined;

/**
 * Retrieve the read receipt from a cached conversation
 *
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
 */
export const hasReadReceipt = (conversation: CachedConversation) =>
  getReadReceipt(conversation) !== undefined;

/**
 * Process a read receipt message
 *
 * The message is not saved to the cache, but rather the metadata of its
 * conversation is updated with the timestamp of the read receipt.
 */
export const processReadReceipt: CachedMessageProcessor = async ({
  message,
  conversation,
  updateConversationMetadata,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (ContentTypeReadReceipt.sameAs(contentType) && conversation) {
    // update message's conversation with the read receipt metadata
    await updateConversationMetadata(
      (message.content as ReadReceipt).timestamp,
    );
  }
};

export const readReceiptsCacheConfig: CacheConfiguration = {
  codecs: [new ReadReceiptCodec()],
  namespace: NAMESPACE,
  processors: {
    [ContentTypeReadReceipt.toString()]: [processReadReceipt],
  },
};

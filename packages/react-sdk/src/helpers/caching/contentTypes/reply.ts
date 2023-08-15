import type { Reply } from "@xmtp/content-type-reply";
import { ReplyCodec, ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeId } from "@xmtp/xmtp-js";
import type { Dexie } from "dexie";
import type { CacheConfiguration, CachedMessageProcessor } from "../db";
import type { CachedMessage } from "../messages";
import { getMessageByXmtpID, updateMessageMetadata } from "../messages";

const NAMESPACE = "replies";

export type CachedRepliesMetadata = string[];

/**
 * Add a reply to the metadata of a cached message
 *
 * Replies are stored as an array of XMTP message IDs in the metadata of
 * the original message.
 */
export const addReply = async (
  xmtpID: Reply["reference"],
  replyXmtpID: string,
  db: Dexie,
) => {
  const message = await getMessageByXmtpID(xmtpID, db);
  if (message) {
    const replies = (message.metadata?.[NAMESPACE] ??
      []) as CachedRepliesMetadata;
    const exists = replies.some((reply) => reply === replyXmtpID);
    if (!exists) {
      replies.push(replyXmtpID);
      await updateMessageMetadata(message, NAMESPACE, replies, db);
    }
  }
};

/**
 * Retrieve all replies to a cached message
 */
export const getReplies = (message: CachedMessage) => {
  const metadata = message?.metadata?.[NAMESPACE] ?? [];
  return metadata as CachedRepliesMetadata;
};

/**
 * Check if a cached message has any replies
 */
export const hasReply = (message: CachedMessage) =>
  getReplies(message).length > 0;

/**
 * Get the original message from a reply message
 *
 * @returns The original message, or `undefined` if the reply message is invalid
 */
export const getOriginalMessageFromReply = async (
  message: CachedMessage,
  db: Dexie,
) => {
  if (
    ContentTypeReply.sameAs(ContentTypeId.fromString(message.contentType)) &&
    message.status === "processed" &&
    message.content
  ) {
    const reply = message.content as Reply;
    return getMessageByXmtpID(reply.reference, db);
  }
  return undefined;
};

/**
 * Process a reply message
 *
 * This saves the reply message to the cache and updates the metadata of the
 * original message with the new reply.
 */
export const processReply: CachedMessageProcessor = async ({
  message,
  db,
  persist,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (ContentTypeReply.sameAs(contentType)) {
    const reply = message.content as Reply;

    // update replies metadata on the referenced message
    await addReply(reply.reference, message.xmtpID, db);

    // save the message to cache
    await persist();
  }
};

export const repliesCacheConfig: CacheConfiguration = {
  codecs: [new ReplyCodec()],
  namespace: NAMESPACE,
  processors: {
    [ContentTypeReply.toString()]: [processReply],
  },
};

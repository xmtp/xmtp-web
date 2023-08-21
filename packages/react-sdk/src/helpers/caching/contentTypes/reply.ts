import type { Reply } from "@xmtp/content-type-reply";
import { ReplyCodec, ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeId } from "@xmtp/xmtp-js";
import type { Dexie } from "dexie";
import { z } from "zod";
import type { CachedMessage } from "@/helpers/caching/messages";
import type {
  ContentTypeConfiguration,
  ContentTypeMessageProcessor,
} from "../db";
import { getMessageByXmtpID, updateMessageMetadata } from "../messages";

const NAMESPACE = "replies";

export type CachedRepliesMetadata = string[];

/**
 * Add a reply to the metadata of a cached message
 *
 * Replies are stored as an array of XMTP message IDs in the metadata of
 * the original message.
 *
 * @param xmtpID XMTP message ID of the original message
 * @param replyXmtpID XMTP message ID of the reply message
 * @param db Database instance
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
 *
 * @param message Cached message
 * @returns An array of XMTP message IDs
 */
export const getReplies = (message: CachedMessage) => {
  const metadata = message?.metadata?.[NAMESPACE] ?? [];
  return metadata as CachedRepliesMetadata;
};

/**
 * Check if a cached message has any replies
 *
 * @param message Cached message
 * @returns `true` if the message has any replies, `false` otherwise
 */
export const hasReply = (message: CachedMessage) =>
  getReplies(message).length > 0;

/**
 * Get the original message from a reply message
 *
 * @param message Cached message
 * @param db Database instance
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

const ReplyContentSchema = z.object({
  content: z.any(),
  contentType: z.object({
    authorityId: z.string(),
    typeId: z.string(),
    versionMajor: z.number().gt(0),
    versionMinor: z.number().gte(0),
  }),
  reference: z.string(),
});

/**
 * Validate the content of a reply message
 *
 * @param content Message content
 * @returns `true` if the content is valid, `false` otherwise
 */
const isValidReplyContent = (content: unknown) => {
  const { success } = ReplyContentSchema.safeParse(content);
  return success;
};

/**
 * Process a reply message
 *
 * Saves the reply message to the cache and updates the metadata of the
 * original message with the new reply.
 */
export const processReply: ContentTypeMessageProcessor = async ({
  message,
  db,
  persist,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (
    ContentTypeReply.sameAs(contentType) &&
    isValidReplyContent(message.content)
  ) {
    const reply = message.content as Reply;

    // update replies metadata on the referenced message
    await addReply(reply.reference, message.xmtpID, db);

    // save the message to cache
    await persist();
  }
};

export const replyContentTypeConfig: ContentTypeConfiguration = {
  codecs: [new ReplyCodec()],
  namespace: NAMESPACE,
  processors: {
    [ContentTypeReply.toString()]: [processReply],
  },
  validators: {
    [ContentTypeReply.toString()]: isValidReplyContent,
  },
};

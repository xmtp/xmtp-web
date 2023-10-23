import type { Reply } from "@xmtp/content-type-reply";
import { ReplyCodec, ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeId } from "@xmtp/xmtp-js";
import type { Dexie, Table } from "dexie";
import { z } from "zod";
import type {
  CachedMessage,
  CachedMessageWithId,
  CachedMessagesTable,
} from "@/helpers/caching/messages";
import type {
  ContentTypeConfiguration,
  ContentTypeMessageProcessor,
} from "../db";
import { getMessageByXmtpID } from "../messages";

const NAMESPACE = "replies";

export type CachedReply = {
  id?: number;
  referenceXmtpID: Reply["reference"];
  xmtpID: string;
};

export type CachedReplyWithId = CachedReply & {
  id: number;
};

export type CachedRepliesTable = Table<CachedReply, number>;

/**
 * Add a reply to the cache
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
  const repliesTable = db.table("replies") as CachedRepliesTable;

  const existing = await repliesTable
    .where({
      referenceXmtpID: xmtpID,
      xmtpID: replyXmtpID,
    })
    .first();

  return existing
    ? (existing as CachedReplyWithId).id
    : repliesTable.add({
        referenceXmtpID: xmtpID,
        xmtpID: replyXmtpID,
      });
};

/**
 * Retrieve all replies to a cached message
 *
 * @param message Cached message
 * @param db Database instance
 * @returns An array of reply messages
 */
export const getReplies = async (message: CachedMessage, db: Dexie) => {
  const repliesTable = db.table("replies") as CachedRepliesTable;
  const replies = await repliesTable
    .where({ referenceXmtpID: message.xmtpID })
    .toArray();
  if (replies.length > 0) {
    const messagesTable = db.table("messages") as CachedMessagesTable;
    const replyMessages = await messagesTable
      .where("xmtpID")
      .anyOf(replies.map((reply) => reply.xmtpID))
      .sortBy("sentAt");
    return replyMessages as CachedMessageWithId[];
  }
  return [];
};

/**
 * Check if a cached message has any replies
 *
 * @param message Cached message
 * @param db Database instance
 * @returns `true` if the message has any replies, `false` otherwise
 */
export const hasReply = async (message: CachedMessage, db: Dexie) => {
  const repliesTable = db.table("replies") as CachedRepliesTable;
  const replies = await repliesTable
    .where({ referenceXmtpID: message.xmtpID })
    .toArray();
  return replies.length > 0;
};

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
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (
    ContentTypeReply.sameAs(contentType) &&
    isValidReplyContent(message.content)
  ) {
    const reply = message.content as Reply;

    // save the reply to cache
    await addReply(reply.reference, message.xmtpID, db);
  }
};

export const replyContentTypeConfig: ContentTypeConfiguration = {
  codecs: [new ReplyCodec()],
  contentTypes: [ContentTypeReply.toString()],
  namespace: NAMESPACE,
  processors: {
    [ContentTypeReply.toString()]: [processReply],
  },
  schema: {
    replies: `
      ++id,
      [referenceXmtpID+xmtpID],
      referenceXmtpID,
      xmtpID
    `,
  },
  validators: {
    [ContentTypeReply.toString()]: isValidReplyContent,
  },
};

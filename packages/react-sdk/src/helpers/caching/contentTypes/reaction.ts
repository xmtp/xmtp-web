import type { Reaction } from "@xmtp/content-type-reaction";
import {
  ReactionCodec,
  ContentTypeReaction,
} from "@xmtp/content-type-reaction";
import { ContentTypeId } from "@xmtp/xmtp-js";
import type { Dexie, Table } from "dexie";
import { z } from "zod";
import type {
  ContentTypeConfiguration,
  ContentTypeMessageProcessor,
} from "../db";
import type { CachedMessage } from "../messages";
import { getMessageByXmtpID, updateMessageMetadata } from "../messages";

const NAMESPACE = "reactions";

export type CachedReaction = {
  content: Reaction["content"];
  id?: number;
  referenceXmtpID: Reaction["reference"];
  schema: Reaction["schema"];
  senderAddress: string;
  xmtpID: string;
};

export type CachedReactionWithId = CachedReaction & {
  id: number;
};

export type CachedReactionQuery = Partial<
  Pick<
    CachedReaction,
    "content" | "referenceXmtpID" | "schema" | "senderAddress"
  >
>;

export type CachedReactionsMetadata = boolean;

export type CachedReactionsTable = Table<CachedReaction, number>;

/**
 * Finds a reaction in the cache
 *
 * @param reaction Cached reaction properties to look for
 * @param db Database instance
 * @returns Cached reaction, or `undefined` if not found
 */
export const findReaction = async (reaction: CachedReaction, db: Dexie) => {
  const reactionsTable = db.table("reactions") as CachedReactionsTable;

  const reactionQuery: CachedReactionQuery = {
    content: reaction.content,
    referenceXmtpID: reaction.referenceXmtpID,
    schema: reaction.schema,
    senderAddress: reaction.senderAddress.toLowerCase(),
  };

  const found = await reactionsTable.where(reactionQuery).first();

  return found ? (found as CachedReactionWithId) : undefined;
};

/**
 * Save a reaction to the cache
 *
 * @param reaction Reaction to save
 * @param db Database instance
 * @returns ID of the saved reaction, or an existing ID if the reaction
 * already exists in the cache
 */
export const saveReaction = async (reaction: CachedReaction, db: Dexie) => {
  const reactionsTable = db.table("reactions") as CachedReactionsTable;

  // check if reaction already exists
  const existing = await findReaction(reaction, db);
  if (existing) {
    return existing.id;
  }

  return reactionsTable.add({
    ...reaction,
    senderAddress: reaction.senderAddress.toLowerCase(),
  });
};

/**
 * Delete a reaction from the cache
 *
 * @param reaction Reaction to delete
 * @param db Database instance
 */
export const deleteReaction = async (reaction: CachedReaction, db: Dexie) => {
  const reactionsTable = db.table("reactions") as CachedReactionsTable;
  // make sure reaction exists
  const existing = await findReaction(reaction, db);
  if (existing) {
    await reactionsTable.delete(existing.id);
  }
};

/**
 * Get all reactions to a cached message by its XMTP ID
 *
 * @param xmtpID The XMTP ID of the cached message
 * @param db Database instance
 * @returns An array of reactions to the message
 */
export const getReactionsByXmtpID = async (
  xmtpID: Reaction["reference"],
  db: Dexie,
) => {
  const reactionsTable = db.table("reactions") as CachedReactionsTable;
  return reactionsTable.where({ referenceXmtpID: xmtpID }).toArray();
};

/**
 * Update the reactions metadata of a cached message
 *
 * The metadata stores the number of reactions to the message only.
 *
 * @param referenceXmtpID The XMTP ID of the cached message
 * @param db Database instance
 */
const updateReactionsMetadata = async (
  referenceXmtpID: Reaction["reference"],
  db: Dexie,
) => {
  const reactions = await getReactionsByXmtpID(referenceXmtpID, db);
  const message = await getMessageByXmtpID(referenceXmtpID, db);
  if (message) {
    await updateMessageMetadata(message, NAMESPACE, reactions.length > 0, db);
  }
};

/**
 * Check if a cached message has a reaction
 *
 * @param message Cached message
 * @returns `true` if the message has a reaction, `false` otherwise
 */
export const hasReaction = (message: CachedMessage) =>
  !!message?.metadata?.[NAMESPACE];

const ReactionContentSchema = z.object({
  reference: z.string(),
  action: z.enum(["added", "removed"]),
  content: z.string(),
  schema: z.enum(["unicode", "shortcode", "custom"]),
});

/**
 * Validate the content of a reaction message
 *
 * @param content Message content
 * @returns `true` if the content is valid, `false` otherwise
 */
const isValidReactionContent = (content: unknown) => {
  const { success } = ReactionContentSchema.safeParse(content);
  return success;
};

/**
 * Process a reaction message
 *
 * Adds or removes the reaction from the cache based on the `action`
 * property. The original message is not saved to the messages cache.
 */
export const processReaction: ContentTypeMessageProcessor = async ({
  message,
  db,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (
    ContentTypeReaction.sameAs(contentType) &&
    isValidReactionContent(message.content)
  ) {
    const reaction = message.content as Reaction;
    const cachedReaction = {
      content: reaction.content,
      referenceXmtpID: reaction.reference,
      schema: reaction.schema,
      senderAddress: message.senderAddress,
      xmtpID: message.xmtpID,
    } satisfies CachedReaction;

    switch (reaction.action) {
      case "added":
        await saveReaction(cachedReaction, db);
        break;
      case "removed":
        await deleteReaction(cachedReaction, db);
        break;
      // no default
    }

    // update reactions metadata on the referenced message
    await updateReactionsMetadata(reaction.reference, db);
  }
};

export const reactionContentTypeConfig: ContentTypeConfiguration = {
  codecs: [new ReactionCodec()],
  namespace: NAMESPACE,
  processors: {
    [ContentTypeReaction.toString()]: [processReaction],
  },
  schema: {
    reactions: `
      ++id,
      [content+referenceXmtpID+schema+senderAddress],
      referenceXmtpID,
      content,
      schema,
      senderAddress,
      xmtpID
    `,
  },
  validators: {
    [ContentTypeReaction.toString()]: isValidReactionContent,
  },
};

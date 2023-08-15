import type { Reaction } from "@xmtp/content-type-reaction";
import {
  ReactionCodec,
  ContentTypeReaction,
} from "@xmtp/content-type-reaction";
import { ContentTypeId } from "@xmtp/xmtp-js";
import type { Dexie, Table } from "dexie";
import type { CacheConfiguration, CachedMessageProcessor } from "../db";
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

export const findReaction = async (reaction: CachedReaction, db: Dexie) => {
  const reactionsTable = db.table("reactions") as CachedReactionsTable;

  const reactionQuery: CachedReactionQuery = {
    content: reaction.content,
    referenceXmtpID: reaction.referenceXmtpID,
    schema: reaction.schema,
    senderAddress: reaction.senderAddress,
  };

  const found = await reactionsTable.where(reactionQuery).first();

  return found ? (found as CachedReactionWithId) : undefined;
};

export const saveReaction = async (reaction: CachedReaction, db: Dexie) => {
  const reactionsTable = db.table("reactions") as CachedReactionsTable;

  // check if reaction already exists
  const existing = await findReaction(reaction, db);
  if (existing) {
    return existing.id;
  }

  return reactionsTable.add(reaction);
};

export const deleteReaction = async (reaction: CachedReaction, db: Dexie) => {
  const reactionsTable = db.table("reactions") as CachedReactionsTable;
  // make sure reaction exists
  const existing = await findReaction(reaction, db);
  if (existing) {
    await reactionsTable.delete(existing.id);
  }
};

export const getReactionsByXmtpID = async (
  xmtpID: Reaction["reference"],
  db: Dexie,
) => {
  const reactionsTable = db.table("reactions") as CachedReactionsTable;
  return reactionsTable.where({ referenceXmtpID: xmtpID }).toArray();
};

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

export const hasReaction = (message: CachedMessage) =>
  !!message?.metadata?.[NAMESPACE];

/**
 * Process a reaction message
 *
 * This will add or remove the reaction from the cache based on the `action`
 * property. The original message is not saved to the messages cache.
 */
export const processReaction: CachedMessageProcessor = async ({
  message,
  db,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (ContentTypeReaction.sameAs(contentType)) {
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

export const reactionsCacheConfig: CacheConfiguration = {
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
};

import type { Conversation, Client, InvitationContext } from "@xmtp/xmtp-js";
import type { Table } from "dexie";
import type Dexie from "dexie";
import { Mutex } from "async-mutex";
import type { ContentTypeMetadata, ContentTypeMetadataValues } from "./db";

export type CachedConversation<M = ContentTypeMetadata> = {
  context?: InvitationContext;
  createdAt: Date;
  isReady: boolean;
  lastSyncedAt?: Date;
  metadata?: M;
  peerAddress: string;
  topic: string;
  updatedAt: Date;
  walletAddress: string;
};

type SearchableProperties = Required<
  Pick<CachedConversation, "peerAddress" | "topic">
>;

type ToFunctionArgs<T> = {
  [P in keyof T]: [key: P, value: T[P]];
}[keyof T];

type GetCachedConversationBy = (
  ...args: [string, ...ToFunctionArgs<SearchableProperties>, Dexie]
) => Promise<CachedConversation | undefined>;

export type CachedConversationsTable = Table<
  CachedConversation,
  string,
  Omit<CachedConversation, "id">
>;

/**
 * Retrieve a cached conversation by a given key and value
 *
 * @returns The cached conversation if found, otherwise `undefined`
 */
export const getCachedConversationBy: GetCachedConversationBy = async (
  walletAddress,
  key,
  value,
  db,
) => {
  const conversationsTable = db.table(
    "conversations",
  ) as CachedConversationsTable;
  const conversation = await conversationsTable
    .where({
      walletAddress,
      [key]: value,
    })
    .first();
  return conversation;
};

/**
 * Retrieve a cached conversation by topic
 *
 * @returns The cached conversation if found, otherwise `undefined`
 */
export const getCachedConversationByTopic = async (
  walletAddress: string,
  topic: string,
  db: Dexie,
) => getCachedConversationBy(walletAddress, "topic", topic, db);

/**
 * Retrieve a cached conversation by peer address
 *
 * @returns The cached conversation if found, otherwise `undefined`
 */
export const getCachedConversationByPeerAddress = async (
  walletAddress: string,
  peerAddress: string,
  db: Dexie,
) => getCachedConversationBy(walletAddress, "peerAddress", peerAddress, db);

/**
 * Retrieve a conversation from the XMTP client by a topic
 *
 * @returns The conversation if found, otherwise `undefined`
 */
export const getConversationByTopic = async (
  topic: string,
  client: Client,
): Promise<Conversation | undefined> => {
  const conversations = await client.conversations.listFromCache();
  let conversation: Conversation | undefined;
  conversations.some((convo) => {
    if (convo.topic === topic) {
      conversation = convo;
      return true;
    }
    return false;
  });
  return conversation;
};

/**
 * Update properties of a cached conversation
 */
export const updateConversation = async (
  topic: string,
  update: Partial<
    Pick<
      CachedConversation,
      "updatedAt" | "isReady" | "metadata" | "lastSyncedAt"
    >
  >,
  db: Dexie,
) => {
  const conversationsTable = db.table(
    "conversations",
  ) as CachedConversationsTable;
  const existing = await conversationsTable
    .where("topic")
    .equals(topic)
    .first();
  if (existing) {
    await conversationsTable.update(existing, update);
  }
};

/**
 * Update metadata of a cached conversation using the specified namespace
 *
 * This is not meant to be called directly
 */
export const updateConversationMetadata = async (
  walletAddress: string,
  topic: string,
  namespace: string,
  data: ContentTypeMetadataValues,
  db: Dexie,
) => {
  const existing = await getCachedConversationByTopic(walletAddress, topic, db);
  if (existing) {
    const metadata = existing.metadata || {};
    metadata[namespace] = data;
    await updateConversation(topic, { metadata }, db);
  }
};

/**
 * Sets the `updatedAt` field of a cached conversation
 */
export const setConversationUpdatedAt = async (
  topic: string,
  updatedAt: CachedConversation["updatedAt"],
  db: Dexie,
) => {
  await updateConversation(topic, { updatedAt }, db);
};

/**
 * Check to see if a topic exists in the conversations cache
 */
export const hasConversationTopic = async (
  walletAddress: string,
  topic: string,
  db: Dexie,
) => {
  const existing = await getCachedConversationByTopic(walletAddress, topic, db);
  return !!existing;
};

/**
 * Converts a Conversation from the XMTP network to its cached format
 *
 * @returns The conversation in cached format
 */
export const toCachedConversation = (
  conversation: Conversation,
  walletAddress: string,
) =>
  ({
    context: conversation.context,
    createdAt: conversation.createdAt,
    isReady: false,
    peerAddress: conversation.peerAddress,
    topic: conversation.topic,
    updatedAt: conversation.createdAt,
    walletAddress,
  }) satisfies Omit<CachedConversation, "id">;

const saveConversationMutex = new Mutex();

/**
 * Save a conversation to the cache
 *
 * @returns The saved cached conversation with ID
 */
export const saveConversation = async (
  conversation: CachedConversation,
  db: Dexie,
) =>
  // ensure that only 1 conversation is saved at a time to prevent duplicates
  saveConversationMutex.runExclusive(async () => {
    const conversations = db.table("conversations") as CachedConversationsTable;

    const existing = await conversations
      .where({
        walletAddress: conversation.walletAddress,
        topic: conversation.topic,
      })
      .first();

    if (existing) {
      return existing;
    }

    await conversations.add(conversation);

    return conversation;
  });

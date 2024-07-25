import Dexie from "dexie";
import type { Client } from "@xmtp/xmtp-js";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import type { CachedMessage } from "@/helpers/caching/messages";
import type { CachedConversation } from "./conversations";
import { textContentTypeConfig } from "./contentTypes/text";

export type ContentTypeMetadataValue =
  | string
  | string[]
  | number
  | number[]
  | boolean
  | boolean[]
  | null
  | Uint8Array;

export type ContentTypeMetadataValues =
  | ContentTypeMetadataValue
  | Record<string, ContentTypeMetadataValue>;

export type ContentTypeMetadata = {
  [namespace: string]: ContentTypeMetadataValues;
};

export type InternalPersistMessageOptions = {
  update?: Partial<Omit<CachedMessage, "id" | "metadata">>;
  metadata?: ContentTypeMetadataValues;
};

export type ContentTypeMessageProcessor<C = any> = (options: {
  client: Client;
  conversation: CachedConversation;
  db: Dexie;
  message: CachedMessage<C>;
  processors?: ContentTypeMessageProcessors;
  updateConversationMetadata: (
    data: ContentTypeMetadataValues,
  ) => Promise<void>;
}) => void | Promise<void>;

export type ContentTypeMessageValidators = Record<
  string,
  (content: unknown) => boolean
>;

export type ContentTypeConfiguration = {
  codecs: ContentCodec<any>[];
  contentTypes: string[];
  namespace: string;
  processors?: ContentTypeMessageProcessors;
  schema?: Record<string, string>;
  validators?: ContentTypeMessageValidators;
};

export type ContentTypeMessageProcessors = {
  [contentType: string]: ContentTypeMessageProcessor[];
};

export type GetDBInstanceOptions = {
  contentTypeConfigs?: ContentTypeConfiguration[];
};

export const getLegacyDB = () => {
  const db = new Dexie("__XMTP__");

  if (db.isOpen()) {
    db.close();
  }

  db.version(1).stores({
    reactions: `
      ++id,
      [content+referenceXmtpID+schema+senderAddress],
      referenceXmtpID,
      content,
      schema,
      senderAddress,
      sentAt,
      xmtpID
    `,
    replies: `
      ++id,
      [referenceXmtpID+xmtpID],
      referenceXmtpID,
      xmtpID
    `,
    conversations: `
      ++id,
      [walletAddress+topic],
      [walletAddress+peerAddress],
      createdAt,
      peerAddress,
      topic,
      updatedAt,
      walletAddress
    `,
    messages: `
      ++id,
      [conversationTopic+walletAddress],
      contentFallback,
      contentType,
      conversationTopic,
      senderAddress,
      sentAt,
      status,
      uuid,
      walletAddress,
      xmtpID
    `,
    consent: `
      [walletAddress+peerAddress],
      peerAddress,
      state,
      walletAddress
    `,
  });
  return db;
};

export const getDB = (contentTypeConfigs?: ContentTypeConfiguration[]) => {
  const db = new Dexie("__XMTP2__");

  if (db.isOpen()) {
    db.close();
  }

  // note that duplicate keys will be overwritten
  const customSchema = contentTypeConfigs?.reduce(
    (result, { schema }) => ({
      ...result,
      ...schema,
    }),
    {} as Record<string, string>,
  );

  db.version(1).stores({
    ...customSchema,
    conversations: `
      topic,
      [walletAddress+topic],
      [walletAddress+peerAddress],
      createdAt,
      peerAddress,
      updatedAt,
      walletAddress
    `,
    messages: `
      id,
      [conversationTopic+walletAddress],
      contentFallback,
      contentType,
      conversationTopic,
      senderAddress,
      sentAt,
      status,
      uuid,
      walletAddress
    `,
    consent: `
      [walletAddress+type+value],
      type,
      value,
      state,
      walletAddress
    `,
  });

  return db;
};

// a promise that resolves when the DB dbMigration is done
let dbMigration: Promise<Dexie> | undefined;

/**
 * Get a new DB instance using the passed options
 */
export const getDbInstance = async (options?: GetDBInstanceOptions) => {
  let migrationRequired = false;

  try {
    const db = new Dexie("__XMTP__");
    // attempt to open legacy DB
    await db.open();
    migrationRequired = true;
    db.close();
  } catch {
    /* empty */
  }

  // no legacy DB to migrate, just use new DB
  if (!migrationRequired) {
    return getDB(options?.contentTypeConfigs);
  }

  // DB migration already in progress, wait for it to finish
  if (dbMigration) {
    const db = await dbMigration;
    return db;
  }

  // start dbMigration
  let dbMigrationResolve: ((value: Dexie) => void) | undefined;
  dbMigration = new Promise((resolve) => {
    dbMigrationResolve = resolve;
  });

  const legacyDB = getLegacyDB();
  const newDB = getDB(options?.contentTypeConfigs);

  /* eslint-disable no-param-reassign, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */

  // migrate conversations table
  const legacyConversations = await legacyDB.table("conversations").toArray();
  await newDB.table("conversations").bulkAdd(
    legacyConversations.map((conversation) => {
      delete conversation.id;
      return conversation;
    }),
  );

  // migrate messages table
  const legacyMessages = await legacyDB.table("messages").toArray();
  await newDB.table("messages").bulkAdd(
    legacyMessages.map((message) => {
      const id = message.xmtpID;
      delete message.xmtpID;
      return { ...message, id };
    }),
  );

  // migrate consent table
  const legacyConsentEntries = await legacyDB.table("consent").toArray();
  await newDB.table("consent").bulkAdd(
    legacyConsentEntries.map((entry) => ({
      type: "address",
      value: entry.peerAddress,
      state: entry.state,
      walletAddress: entry.walletAddress,
    })),
  );

  // migrate reactions table
  const legacyReactions = await legacyDB.table("reactions").toArray();
  if (legacyReactions.length > 0) {
    await newDB.table("reactions").bulkAdd(
      legacyReactions.map((reaction) => {
        const id = reaction.xmtpID;
        delete reaction.xmtpID;
        return { ...reaction, id };
      }),
    );
  }

  /* eslint-enable no-param-reassign, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */

  // migrate replies table
  const legacyReplies = await legacyDB.table("replies").toArray();
  if (legacyReplies.length > 0) {
    await newDB.table("replies").bulkAdd(legacyReplies);
  }

  // close and delete legacy DB
  legacyDB.close();
  await legacyDB.delete();

  // resolve DB migration promise
  dbMigrationResolve?.(newDB);

  // return new DB instance
  return newDB;
};

export const clearCache = async (db: Dexie) => {
  // clear all data
  await Promise.all(db.tables.map((table) => table.clear()));
};

// handle text messages by default
export const defaultContentTypeConfigs = [textContentTypeConfig];

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
  db?: Dexie;
  contentTypeConfigs?: ContentTypeConfiguration[];
};

/**
 * Get a new DB instance using the passed options
 */
export const getDbInstance = (options?: GetDBInstanceOptions) => {
  const db = options?.db ?? new Dexie("__XMTP__");

  // do not attempt to version the db if it is already open
  if (!db.isOpen()) {
    // note that duplicate keys will be overwritten
    const customSchema = options?.contentTypeConfigs?.reduce(
      (result, { schema }) => ({
        ...result,
        ...schema,
      }),
      {} as Record<string, string>,
    );

    db.version(999).stores({
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

    // only apply DB upgrades if the DB version is < 999
    if (db.verno >= 999) {
      console.log("DB version is >= 999. skipping migration...");
      return db;
    }

    console.log("migrating to new schema...");

    // old schema
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

    db.version(999)
      // new schema for migrating
      .stores({
        conversations2: `
          topic,
          [walletAddress+topic],
          [walletAddress+peerAddress],
          createdAt,
          peerAddress,
          updatedAt,
          walletAddress
        `,
        messages2: `
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
        consent2: `
          [walletAddress+type+value],
          type,
          value,
          state,
          walletAddress
        `,
        reactions2: `
          id,
          [content+referenceXmtpID+schema+senderAddress],
          referenceXmtpID,
          content,
          schema,
          senderAddress,
          sentAt
        `,
      })
      .upgrade((tx) => {
        // migrate conversations table
        const migrateConversations = db
          .table("conversations")
          .toArray()
          .then((conversations) =>
            db.table("conversations2").bulkAdd(
              conversations.map((conversation) => {
                delete conversation.id;
                return conversation;
              }),
            ),
          )
          .then(() => {
            // remove old table
            tmpDb.backendDB().deleteObjectStore("conversations");
            // rename new table
            tx.idbtrans.objectStore("conversations2").name = "conversations";
          });

        // migrate messages table
        const migrateMessages = db
          .table("messages")
          .toArray()
          .then((messages) =>
            db.table("messages2").bulkAdd(
              messages.map((message) => {
                const id = message.xmtpID;
                delete message.xmtpID;
                return { ...message, id };
              }),
            ),
          )
          .then(() => {
            // remove old table
            tmpDb.backendDB().deleteObjectStore("messages");
            // rename new table
            tx.idbtrans.objectStore("messages2").name = "messages";
          });

        // migrate consent table
        const migrateConsent = db
          .table("consent")
          .toArray()
          .then((consent) =>
            db.table("consent2").bulkAdd(
              consent.map((entry) => ({
                type: "address",
                value: entry.peerAddress,
                state: entry.state,
                walletAddress: entry.walletAddress,
              })),
            ),
          )
          .then(() => {
            // remove old table
            tmpDb.backendDB().deleteObjectStore("consent");
            // rename new table
            tx.idbtrans.objectStore("consent2").name = "consent";
          });

        // migrate reactions table
        const migrateReactions = db
          .table("reactions")
          .toArray()
          .then((reactions) =>
            db.table("reactions2").bulkAdd(
              reactions.map((reaction) => {
                const id = reaction.xmtpID;
                delete reaction.xmtpID;
                return { ...reaction, id };
              }),
            ),
          )
          .then(() => {
            // remove old table
            tmpDb.backendDB().deleteObjectStore("reactions");
            // rename new table
            tx.idbtrans.objectStore("reactions2").name = "reactions";
          });

        console.log("returning promises....");

        return Promise.all([
          migrateConversations,
          migrateMessages,
          migrateConsent,
          migrateReactions,
        ]);
      });
  }

  return db;
};

export const clearCache = async (db: Dexie) => {
  // clear all data
  await Promise.all(db.tables.map((table) => table.clear()));
};

// handle text messages by default
export const defaultContentTypeConfigs = [textContentTypeConfig];

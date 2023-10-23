import Dexie from "dexie";
import type { Client, ContentCodec } from "@xmtp/xmtp-js";
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
  version?: number;
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

    const version = options?.version ?? 1;

    db.version(version).stores({
      ...customSchema,
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

import Dexie from "dexie";
import type { Client, ContentCodec } from "@xmtp/xmtp-js";
import type {
  CachedMessage,
  CachedMessageWithId,
} from "@/helpers/caching/messages";
import type { CachedConversation } from "./conversations";
import { textCacheConfig } from "./contentTypes/text";

export type CachedMetadataValue =
  | string
  | string[]
  | number
  | number[]
  | boolean
  | boolean[]
  | null
  | Uint8Array;

export type CachedMetadataValues =
  | CachedMetadataValue
  | Record<string, CachedMetadataValue>;

export type CachedMetadata = {
  [namespace: string]: CachedMetadataValues;
};

export type InternalPersistMessageOptions = {
  update?: Partial<Omit<CachedMessage, "id" | "metadata">>;
  metadata?: CachedMetadataValues;
};

export type InternalPersistMessage = (
  options?: InternalPersistMessageOptions,
) => Promise<CachedMessageWithId<any>>;

export type CachedMessageProcessor<C = any> = (options: {
  client: Client;
  conversation: CachedConversation;
  db: Dexie;
  message: CachedMessageWithId<C>;
  processors: CachedMessageProcessors;
  persist: InternalPersistMessage;
  updateConversationMetadata: (data: CachedMetadataValues) => Promise<void>;
}) => Promise<void>;

export type CacheConfiguration = {
  codecs?: ContentCodec<any>[];
  namespace: string;
  processors: CachedMessageProcessors;
  schema?: Record<string, string>;
};

export type CachedMessageProcessors = {
  [contentType: string]: CachedMessageProcessor[];
};

export type GetDBInstanceOptions = {
  db?: Dexie;
  cacheConfig?: CacheConfiguration[];
  version?: number;
};

/**
 * Get a new DB instance using the passed options
 */
export const getDbInstance = (options?: GetDBInstanceOptions) => {
  const db = options?.db ?? new Dexie("__XMTP__");

  // note that duplicate keys will be overwritten
  const customSchema = options?.cacheConfig?.reduce(
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
      [topic+walletAddress],
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
      hasSendError,
      senderAddress,
      sentAt,
      status,
      uuid,
      walletAddress,
      xmtpID
    `,
  });

  return db;
};

export const clearCache = async (db: Dexie) => {
  // clear all data
  await Promise.all(db.tables.map((table) => table.clear()));
};

// handle text messages by default
export const defaultCacheConfig = [textCacheConfig];

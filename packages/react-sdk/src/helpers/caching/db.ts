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

const getDbSchema = (db: Dexie) =>
  JSON.stringify(
    db.tables
      .map(({ name, schema }) => ({
        name,
        schema: [
          schema.primKey.src,
          ...schema.indexes.map((idx) => idx.src).sort(),
        ].join(","),
      }))
      .sort((a, b) => (a.name < b.name ? 1 : -1)),
  );

const hasSchemaChanged = async (db: Dexie) => {
  const declaredSchema = getDbSchema(db);
  const newDb = new Dexie(db.name);
  await newDb.open();
  const installedSchema = getDbSchema(newDb);
  return declaredSchema !== installedSchema;
};

const checkSchema = async (version: number, schema: Record<string, string>) => {
  const db = new Dexie("__XMTP__");
  db.version(version).stores(schema);
  await db.open();
  if (await hasSchemaChanged(db)) {
    throw new Error(
      `The local DB schema has changed and must be upgraded.
      
To upgrade the schema, pass in a value for the "dbVersion" prop of the <XMTPProvider> component greater than ${version}, which is the current value.

For more info, see https://github.com/xmtp/xmtp-web/blob/main/packages/react-sdk/README.md#database-schema-updates`,
    );
  }
};

/**
 * Get a new DB instance using the passed options
 */
export const getDbInstance = (options?: GetDBInstanceOptions) => {
  const db = options?.db ?? new Dexie("__XMTP__");

  // DB must be closed before versioning and setting schema
  if (db.isOpen()) {
    db.close();
  }

  // do not attempt to version the db if it is already open
  // note that duplicate keys will be overwritten
  const customSchema = options?.contentTypeConfigs?.reduce(
    (result, { schema }) => ({
      ...result,
      ...schema,
    }),
    {} as Record<string, string>,
  );

  const version = options?.version ?? 1;
  const dbSchema: Record<string, string> = {
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
    consent: `
      [walletAddress+peerAddress],
      peerAddress,
      state,
      walletAddress
    `,
  };

  // set DB version and schema
  db.version(version).stores(dbSchema);

  // check if there's a schema mismatch
  void checkSchema(version, dbSchema);

  return db;
};

export const clearCache = async (db: Dexie) => {
  // clear all data
  await Promise.all(db.tables.map((table) => table.clear()));
};

// handle text messages by default
export const defaultContentTypeConfigs = [textContentTypeConfig];

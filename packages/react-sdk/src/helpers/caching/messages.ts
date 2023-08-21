import type { Client, DecodedMessage, SendOptions } from "@xmtp/xmtp-js";
import { ContentTypeText, decodeContent } from "@xmtp/xmtp-js";
import type { Table } from "dexie";
import type Dexie from "dexie";
import { isAfter } from "date-fns";
import { v4 } from "uuid";
import type {
  ContentTypeMessageProcessors,
  ContentTypeMessageValidators,
  ContentTypeMetadata,
  ContentTypeMetadataValues,
  InternalPersistMessage,
} from "./db";
import type { CachedConversation } from "./conversations";
import {
  getCachedConversationByTopic,
  setConversationUpdatedAt,
  updateConversationMetadata as _updateConversationMetadata,
} from "./conversations";

export type CachedMessage<C = any, M = ContentTypeMetadata> = {
  content: C;
  contentBytes?: Uint8Array;
  contentFallback?: string;
  contentType: string;
  conversationTopic: string;
  hasSendError: boolean;
  id?: number;
  isSending: boolean;
  metadata?: M;
  senderAddress: string;
  sendOptions?: SendOptions;
  sentAt: Date;
  status: "unprocessed" | "processed";
  uuid: string;
  walletAddress: string;
  xmtpID: string;
};

export type CachedMessagesTable = Table<CachedMessage, number>;

export type CachedMessageWithId<C = any> = CachedMessage<C> & {
  id: number;
};

/**
 * Converts a DecodedMessage from the XMTP network to its cached format
 *
 * @param message The message to convert
 * @param walletAddress The wallet address associated with the message
 * @returns The message in cached format
 */
export const toCachedMessage = (
  message: DecodedMessage,
  walletAddress: string,
) => {
  // if message content is undefined, its content type is not yet supported
  // by the client
  const isSupported = message.content !== undefined;

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    content: message.content,
    // store content bytes if the content type is not supported so we can
    // process it later if support is added
    contentBytes: !isSupported ? message.contentBytes : undefined,
    contentFallback: message.contentFallback,
    contentType: message.contentType.toString(),
    conversationTopic: message.contentTopic,
    status: "unprocessed",
    hasSendError: false,
    isSending: false,
    senderAddress: message.senderAddress,
    sentAt: message.sent,
    uuid: v4(),
    walletAddress,
    xmtpID: message.id,
  } satisfies CachedMessage;
};

/**
 * Retrieve a message from the cache by its XMTP ID
 *
 * @param xmtpID The XMTP ID of the message to retrieve
 * @param db Database instance
 * @returns The cached message, or `undefined` if not found
 */
export const getMessageByXmtpID = async (xmtpID: string, db: Dexie) => {
  const messages = db.table("messages") as CachedMessagesTable;
  const message = await messages.where("xmtpID").equals(xmtpID).first();
  return message ? (message as CachedMessageWithId) : undefined;
};

export type SaveMessageOptions = Omit<
  ProcessMessageOptions,
  "client" | "conversation" | "processors" | "namespaces" | "validators"
>;

/**
 * Save a message to the cache
 *
 * @returns The newly cached message, or an already existing cached message
 */
export const saveMessage = async (message: CachedMessage, db: Dexie) => {
  const messages = db.table("messages") as CachedMessagesTable;

  // check if message already exists
  const existing = await getMessageByXmtpID(message.xmtpID, db);

  if (existing) {
    // return the existing message
    return existing as CachedMessageWithId;
  }

  // eslint-disable-next-line no-param-reassign
  message.id = await messages.add(message);

  return message as CachedMessageWithId;
};

/**
 * Remove a message from the cache
 */
export const deleteMessage = async (
  message: CachedMessageWithId,
  db: Dexie,
) => {
  const messagesTable = db.table("messages") as CachedMessagesTable;

  // make sure message exists
  const existing = await messagesTable.where("id").equals(message.id).first();
  if (existing) {
    await messagesTable.delete(message.id);
  }
};

/**
 * Update properties of a cached message
 */
export const updateMessage = async (
  message: CachedMessage,
  update: Partial<
    Pick<
      CachedMessage,
      | "status"
      | "isSending"
      | "sentAt"
      | "xmtpID"
      | "metadata"
      | "hasSendError"
      | "sendOptions"
    >
  >,
  db: Dexie,
) => {
  const messagesTable = db.table("messages") as CachedMessagesTable;
  await messagesTable.update(message, update);
};

/**
 * Update metadata of a cached message using the specified namespace
 *
 * This is not meant to be called directly
 */
export const updateMessageMetadata = async (
  message: CachedMessage,
  namespace: string,
  data: ContentTypeMetadataValues,
  db: Dexie,
) => {
  const metadata = message.metadata || {};
  metadata[namespace] = data;
  return updateMessage(message, { metadata }, db);
};

export type PrepareMessageOptions = Pick<CachedMessage, "content"> &
  Pick<Partial<CachedMessage>, "contentType"> & {
    client: Client;
    conversation: CachedConversation;
  };

/**
 * Prepare a message for sending by creating a new cached message based on all
 * the passed properties
 *
 * @returns a new cached message
 */
export const prepareMessageForSending = ({
  client,
  content,
  contentType,
  conversation,
}: PrepareMessageOptions): CachedMessage => {
  // this will be updated after it's sent
  const sentAt = new Date();
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    content,
    contentType: contentType ?? ContentTypeText.toString(),
    conversationTopic: conversation.topic,
    hasSendError: false,
    isSending: true,
    senderAddress: client.address,
    sentAt,
    status: "unprocessed",
    uuid: v4(),
    walletAddress: client.address,
    // this will be updated after it's sent
    xmtpID: sentAt.getTime().toString(),
  };
};

/**
 * Update some message properties after it's successfully sent
 */
export const updateMessageAfterSending = async (
  message: CachedMessage,
  sentAt: Date,
  xmtpID: string,
  db: Dexie,
) =>
  updateMessage(
    message,
    {
      hasSendError: false,
      isSending: false,
      sendOptions: undefined,
      sentAt,
      xmtpID,
    },
    db,
  );

export type ProcessMessageOptions = {
  client: Client;
  conversation: CachedConversation;
  db: Dexie;
  message: CachedMessage;
  namespaces: Record<string, string>;
  processors: ContentTypeMessageProcessors;
  validators: ContentTypeMessageValidators;
};

export type ReprocessMessageOptions = ProcessMessageOptions & {
  /**
   * This is a convenience option to override the default message processor
   * for testing purposes and should not be used in production.
   */
  process?: typeof processMessage;
  /**
   * This is a convenience option to override the default content decoder
   * for testing purposes and should not be used in production.
   */
  decode?: typeof decodeContent;
};

/**
 * Process a cached message using the passed parameters. Optionally remove
 * an existing message before processing.
 */
export const processMessage = async (
  {
    client,
    conversation,
    db,
    message,
    namespaces,
    processors,
    validators,
  }: ProcessMessageOptions,
  removeExisting = false,
) => {
  const existingMessage = await getMessageByXmtpID(message.xmtpID, db);
  // don't re-process an existing message
  if (existingMessage && existingMessage.status === "processed") {
    return message;
  }

  // don't process invalid message content
  const isContentValid = validators[message.contentType];
  if (isContentValid && !isContentValid(message.content)) {
    return message;
  }

  let persistedMessage: CachedMessageWithId | undefined;
  const namespace = namespaces[message.contentType];

  // internal persist function with preset namespace
  const persist: InternalPersistMessage = async ({ metadata, update } = {}) => {
    const updatedMetadata = { ...message.metadata };
    if (metadata && namespace) {
      updatedMetadata[namespace] = metadata;
    }
    const updatedMessage = {
      ...message,
      ...update,
    };

    if (Object.keys(updatedMetadata).length > 0) {
      updatedMessage.metadata = updatedMetadata;
    }

    persistedMessage = await saveMessage(updatedMessage, db);
    return persistedMessage;
  };

  // internal updater function with preset namespace
  const updateConversationMetadata = async (
    data: ContentTypeMetadataValues,
  ) => {
    await _updateConversationMetadata(conversation.topic, namespace, data, db);
  };

  // message content type is not supported, skip processing
  if (message.content === undefined) {
    // don't persist the message if it already exists in the cache
    if (!(await getMessageByXmtpID(message.xmtpID, db))) {
      // persist the message to cache so that it can be processed later
      const savedMessage = await saveMessage(message, db);
      return savedMessage;
    }
    return message;
  }

  // remove existing message if requested
  if (
    removeExisting &&
    message.id &&
    (await getMessageByXmtpID(message.xmtpID, db))
  ) {
    await deleteMessage(message as CachedMessageWithId, db);
  }

  if (processors[message.contentType]) {
    // run all content processors for this content type
    await Promise.all(
      processors[message.contentType].map((processor) =>
        processor({
          client,
          conversation,
          db,
          message: message as CachedMessageWithId,
          processors,
          persist,
          updateConversationMetadata,
        }),
      ),
    );
  }

  // update conversation's last message time
  if (isAfter(message.sentAt, conversation.updatedAt)) {
    await setConversationUpdatedAt(conversation.topic, message.sentAt, db);
  }

  // if the message was cached, update its `status` to `processed`
  if (persistedMessage) {
    await updateMessage(persistedMessage, { status: "processed" }, db);
  }

  return persistedMessage ?? message;
};

/**
 * Reprocessing a message if it has the following requirements:
 *
 * - Message content must be undefined (not decoded)
 * - Message content bytes must be defined
 * - Client must be defined (for decoding)
 * - Message content type must have a processor
 *
 * Reprocessing a message will remove its original entry in the cache and
 * create a new one.
 */
export const reprocessMessage = async ({
  client,
  conversation,
  db,
  message,
  namespaces,
  processors,
  validators,
  process = processMessage,
  decode = decodeContent,
}: ReprocessMessageOptions) => {
  if (
    message.content === undefined &&
    message.contentBytes &&
    client &&
    processors[message.contentType]
  ) {
    // decode message content
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const content = await decode(message.contentBytes, client);

    // content type is still not supported, skip processing
    if (content.content === undefined) {
      return message;
    }

    // process message with decoded content, remove existing message
    return process(
      {
        conversation,
        client,
        db,
        message: {
          ...message,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          content: content.content,
          contentBytes: undefined,
        },
        namespaces,
        processors,
        validators,
      },
      true,
    );
  }

  return message;
};

/**
 * Retrieve the last message of conversation in the cache
 */
export const getLastMessage = async (topic: string, db: Dexie) => {
  const messagesTable = db.table("messages") as CachedMessagesTable;
  const messages = await messagesTable
    .where({
      conversationTopic: topic,
    })
    .reverse()
    .sortBy("sentAt");
  return messages[0];
};

/**
 * Retrieve all unprocessed messages in the cache
 */
export const getUnprocessedMessages = async (db: Dexie) => {
  const messagesTable = db.table("messages") as CachedMessagesTable;
  const messages = await messagesTable
    .where({
      status: "unprocessed",
    })
    .toArray();
  return messages;
};

export type ProcessUnprocessedMessagesOptions = Omit<
  ProcessMessageOptions,
  "conversation" | "message"
> & {
  /**
   * This is a convenience option to override the default `reprocessMessage`
   * for testing purposes and should not be used in production.
   */
  reprocess?: typeof reprocessMessage;
};

/**
 * Process all unprocessed messages in the cache
 */
export const processUnprocessedMessages = async ({
  client,
  db,
  namespaces,
  processors,
  validators,
  reprocess = reprocessMessage,
}: ProcessUnprocessedMessagesOptions) => {
  const unprocessed = await getUnprocessedMessages(db);
  await Promise.all(
    unprocessed.map(async (unprocessedMessage) => {
      // get message's conversation from cache
      const conversation = await getCachedConversationByTopic(
        unprocessedMessage.conversationTopic,
        db,
      );
      // must have a conversation already in the cache
      if (conversation) {
        await reprocess({
          conversation,
          client,
          db,
          message: unprocessedMessage,
          namespaces,
          processors,
          validators,
        });
      }
    }),
  );
};

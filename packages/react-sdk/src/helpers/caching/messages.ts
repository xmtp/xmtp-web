import type {
  Client,
  Conversation,
  DecodedMessage,
  SendOptions,
} from "@xmtp/xmtp-js";
import { decodeContent } from "@xmtp/xmtp-js";
import type { Table } from "dexie";
import type Dexie from "dexie";
import { isAfter } from "date-fns";
import { v4 } from "uuid";
import { ContentTypeText } from "@xmtp/content-type-text";
import type {
  ContentTypeMessageProcessors,
  ContentTypeMessageValidators,
  ContentTypeMetadata,
  ContentTypeMetadataValues,
} from "./db";
import type { CachedConversation } from "./conversations";
import {
  getCachedConversationByTopic,
  setConversationUpdatedAt,
  updateConversationMetadata as _updateConversationMetadata,
  getConversationByTopic,
} from "./conversations";

export type CachedMessage<C = any, M = ContentTypeMetadata> = {
  content: C;
  contentBytes?: Uint8Array;
  contentFallback?: string;
  contentType: string;
  conversationTopic: string;
  hasLoadError: boolean;
  hasSendError: boolean;
  id: string;
  isSending: boolean;
  metadata?: M;
  senderAddress: string;
  sendOptions?: SendOptions;
  sentAt: Date;
  status: "unprocessed" | "processed";
  uuid: string;
  walletAddress: string;
};

export type CachedMessagesTable<C = any> = Table<CachedMessage<C>, string>;

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
    hasLoadError: false,
    hasSendError: false,
    id: message.id,
    isSending: false,
    senderAddress: message.senderAddress,
    sentAt: message.sent,
    uuid: v4(),
    walletAddress,
  } satisfies CachedMessage;
};

/**
 * Retrieve a message from the cache by its XMTP ID
 *
 * @param id The XMTP ID of the message to retrieve
 * @param db Database instance
 * @returns The cached message, or `undefined` if not found
 */
export const getMessageByXmtpID = async (id: string, db: Dexie) => {
  const messages = db.table("messages") as CachedMessagesTable;
  const message = await messages.where("id").equals(id).first();
  return message;
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
  const existing = await getMessageByXmtpID(message.id, db);

  if (existing) {
    // return the existing message
    return existing;
  }

  const id = await messages.add(message);

  return {
    ...message,
    id,
  };
};

/**
 * Remove a message from the cache
 */
export const deleteMessage = async (message: CachedMessage, db: Dexie) => {
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
      | "id"
      | "metadata"
      | "hasLoadError"
      | "hasSendError"
      | "sendOptions"
    >
  >,
  db: Dexie,
) => {
  const messagesTable = db.table("messages") as CachedMessagesTable;
  await messagesTable.update(message, update);
  // return updated message
  return {
    ...message,
    ...update,
  };
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
    sendOptions?: SendOptions;
  };

/**
 * Prepare a message for sending by creating a new cached message based on all
 * the passed properties
 *
 * @returns a new cached message
 */
export const prepareMessageForSending = async ({
  client,
  content,
  conversation,
  sendOptions,
}: PrepareMessageOptions): Promise<{
  message: CachedMessage;
  preparedMessage: Awaited<ReturnType<Conversation["prepareMessage"]>>;
}> => {
  const networkConversation = await getConversationByTopic(
    conversation.topic,
    client,
  );

  if (!networkConversation) {
    throw new Error(
      "Conversation not found in XMTP client, unable to prepare message",
    );
  }

  const preparedMessage = await networkConversation.prepareMessage(
    content,
    sendOptions,
  );

  // this will be updated after it's sent
  const sentAt = new Date();
  const message = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    content,
    contentType:
      sendOptions?.contentType?.toString() ?? ContentTypeText.toString(),
    conversationTopic: conversation.topic,
    hasLoadError: false,
    hasSendError: false,
    id: await preparedMessage.messageID(),
    isSending: true,
    senderAddress: client.address,
    sentAt,
    status: "unprocessed",
    uuid: v4(),
    walletAddress: client.address,
  } satisfies CachedMessage;

  return {
    message,
    preparedMessage,
  };
};

/**
 * Update some message properties after it's successfully sent
 */
export const updateMessageAfterSending = async (
  message: CachedMessage,
  sentAt: Date,
  db: Dexie,
) =>
  updateMessage(
    message,
    {
      hasSendError: false,
      isSending: false,
      sendOptions: undefined,
      sentAt,
    },
    db,
  );

export type ProcessMessageOptions = {
  client?: Client;
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

// XMTP IDs of messages currently being processed
const processQueue: string[] = [];

type ProcessStatus =
  | "no_client"
  | "queued"
  | "duplicate"
  | "invalid"
  | "unsupported"
  | "processed";

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
): Promise<{
  status: ProcessStatus;
  message: CachedMessage;
}> => {
  // client is required
  if (!client) {
    return {
      status: "no_client",
      message,
    };
  }

  // don't process a message if it's already in the queue
  if (processQueue.includes(message.id)) {
    return {
      status: "queued",
      message,
    };
  }

  // add message to the processing queue
  processQueue.push(message.id);

  const namespace = namespaces[message.contentType];

  try {
    const existingMessage = await getMessageByXmtpID(message.id, db);
    // don't re-process an existing message that's already processed
    if (existingMessage && existingMessage.status === "processed") {
      return {
        status: "duplicate",
        message,
      };
    }

    // don't process invalid message content
    const isContentValid = validators[message.contentType];
    if (isContentValid && !isContentValid(message.content)) {
      return {
        status: "invalid",
        message,
      };
    }

    // internal updater function with preset namespace
    const updateConversationMetadata = async (
      data: ContentTypeMetadataValues,
    ) => {
      await _updateConversationMetadata(
        client.address,
        conversation.topic,
        namespace,
        data,
        db,
      );
    };

    // message content type is not supported, skip processing
    if (message.content === undefined) {
      return {
        status: "unsupported",
        // if the message is not in the cache, save it to be processed later
        message: !existingMessage ? await saveMessage(message, db) : message,
      };
    }

    // remove existing message if requested
    if (removeExisting && existingMessage) {
      await deleteMessage(existingMessage, db);
    }

    if (processors[message.contentType]) {
      // run all content processors for this content type
      await Promise.all(
        processors[message.contentType].map((processor) =>
          processor({
            client,
            conversation,
            db,
            message,
            processors,
            updateConversationMetadata,
          }),
        ),
      );
    }

    // save message to cache
    const persistedMessage = await saveMessage(message, db);

    // update conversation's last message time if the message has already been
    // sent and its sent time is after the conversation's last message time
    if (!message.isSending && isAfter(message.sentAt, conversation.updatedAt)) {
      await setConversationUpdatedAt(conversation.topic, message.sentAt, db);
    }

    // update message `status` to `processed`
    const updatedMessage = await updateMessage(
      persistedMessage,
      { status: "processed" },
      db,
    );

    return {
      status: "processed",
      message: updatedMessage,
    };
  } finally {
    // always remove message from the processing queue
    const index = processQueue.indexOf(message.id);
    if (index > -1) {
      processQueue.splice(index, 1);
    }
  }
};

/**
 * Reprocess a message if it has the following requirements:
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
  "conversation" | "message" | "client"
> &
  Pick<Required<ProcessMessageOptions>, "client"> & {
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
        client.address,
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

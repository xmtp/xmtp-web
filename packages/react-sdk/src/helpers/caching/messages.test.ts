import type { ArgumentsType } from "vitest";
import { it, expect, describe, beforeEach } from "vitest";
import { Client, ContentTypeText, DecodedMessage } from "@xmtp/xmtp-js";
import type { CachedMessage } from "@/helpers/caching/messages";
import {
  saveMessage,
  getMessageByXmtpID,
  deleteMessage,
  updateMessage,
  updateMessageMetadata,
  prepareMessageForSending,
  updateMessageAfterSending,
  getLastMessage,
  getUnprocessedMessages,
  toCachedMessage,
  processMessage,
  reprocessMessage,
  processUnprocessedMessages,
} from "@/helpers/caching/messages";
import type { ContentTypeMessageProcessor } from "@/helpers/caching/db";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import {
  saveConversation,
  type CachedConversation,
  getCachedConversationByTopic,
  toCachedConversation,
} from "@/helpers/caching/conversations";
import { adjustDate } from "@/helpers/adjustDate";
import { textContentTypeConfig } from "@/helpers/caching/contentTypes/text";
import { createRandomWallet } from "@/helpers/testing";

const db = getDbInstance();
const testWallet1 = createRandomWallet();
const testWallet2 = createRandomWallet();

beforeEach(async () => {
  await clearCache(db);
});

describe("toCachedMessage", () => {
  it("should return a cached message in the right format", async () => {
    const testClient1 = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });
    const testConversation = await testClient1.conversations.newConversation(
      testWallet2.account.address,
      undefined,
    );
    const sentAt = new Date();
    const decodedMessage = new DecodedMessage({
      id: "testId",
      messageVersion: "v2",
      senderAddress: "testSenderAddress",
      recipientAddress: "testRecipientAddress",
      sent: sentAt,
      content: "",
      contentType: ContentTypeText,
      contentBytes: new Uint8Array(),
      contentTopic: "testTopic",
      conversation: testConversation,
    });

    const cachedMessage = toCachedMessage(decodedMessage, "testWalletAddress");
    expect(cachedMessage.content).toBe("");
    expect(cachedMessage.contentBytes).toBe(undefined);
    expect(cachedMessage.contentFallback).toBe(undefined);
    expect(cachedMessage.contentType).toBe(ContentTypeText.toString());
    expect(cachedMessage.conversationTopic).toBe("testTopic");
    expect(cachedMessage.status).toBe("unprocessed");
    expect(cachedMessage.hasSendError).toBe(false);
    expect(cachedMessage.isSending).toBe(false);
    expect(cachedMessage.senderAddress).toBe("testSenderAddress");
    expect(cachedMessage.sentAt).toBe(sentAt);
    expect(cachedMessage.walletAddress).toBe("testWalletAddress");
    expect(cachedMessage.xmtpID).toBe("testId");
  });
});

describe("getMessageByXmtpID", () => {
  it("should return a message from the cache", async () => {
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt: new Date(),
      status: "processed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    await db.table("messages").add(testMessage);
    const message = await getMessageByXmtpID("testXmtpId", db);
    expect(message).toEqual(testMessage);
  });
});

describe("saveMessage", () => {
  it("should save a message to the cache", async () => {
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt: new Date(),
      status: "processed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    const cachedMessage = await saveMessage(testMessage, db);
    expect(cachedMessage).toEqual(testMessage);

    const message = await getMessageByXmtpID("testXmtpId", db);
    expect(message).toEqual(testMessage);
  });

  it("should return a duplicate message", async () => {
    const testMessage = {
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt: new Date(),
      status: "processed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;
    const cachedMessage = await saveMessage(testMessage, db);
    expect(cachedMessage).toEqual(testMessage);
    const cachedMessage2 = await saveMessage(testMessage, db);
    expect(cachedMessage2).toEqual(testMessage);
    expect(cachedMessage.id).toBe(cachedMessage2.id);
  });
});

describe("deleteMessage", () => {
  it("should delete a message from the cache", async () => {
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt: new Date(),
      status: "unprocessed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    await saveMessage(testMessage, db);
    const message = await getMessageByXmtpID("testXmtpId", db);
    expect(message).toEqual(testMessage);

    if (message) {
      await deleteMessage(message, db);
      const deletedMessage = await getMessageByXmtpID("testXmtpId", db);
      expect(deletedMessage).toBeUndefined();
    }
  });
});

describe("updateMessage", () => {
  it("should update a message's properties in the cache", async () => {
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: true,
      hasLoadError: false,
      hasSendError: false,
      sentAt: new Date(),
      status: "unprocessed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    const cachedMessage = await saveMessage(testMessage, db);
    expect(cachedMessage).toEqual(testMessage);

    await updateMessage(
      cachedMessage,
      {
        isSending: false,
        status: "processed",
      },
      db,
    );

    const updatedMessage = await getMessageByXmtpID("testXmtpId", db);

    expect(updatedMessage).toEqual({
      ...testMessage,
      isSending: false,
      status: "processed",
    });
  });
});

describe("updateMessageMetadata", () => {
  it("should update a message's metadata in the cache", async () => {
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt: new Date(),
      status: "processed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    const cachedMessage = await saveMessage(testMessage, db);
    expect(cachedMessage).toEqual(testMessage);

    await updateMessageMetadata(
      cachedMessage,
      "foo",
      {
        foo: "bar",
        baz: "qux",
      },
      db,
    );

    const updatedMessage = await getMessageByXmtpID("testXmtpId", db);

    expect(updatedMessage?.metadata?.foo).toEqual({
      foo: "bar",
      baz: "qux",
    });

    await updateMessageMetadata(
      cachedMessage,
      "foo",
      {
        foo: "baz",
        qux: "quux",
      },
      db,
    );

    const updatedMessage2 = await getMessageByXmtpID("testXmtpId", db);

    expect(updatedMessage2?.metadata?.foo).toEqual({
      foo: "baz",
      qux: "quux",
    });
  });
});

describe("prepareMessageForSending", () => {
  it("should throw an error if the conversation is not found", async () => {
    const client = await Client.create(testWallet1, { env: "local" });

    await expect(async () => {
      await prepareMessageForSending({
        client,
        content: "test",
        contentType: ContentTypeText.toString(),
        conversation: {
          createdAt: new Date(),
          id: 1,
          isReady: true,
          peerAddress: "testPeerAddress",
          topic: "testTopic",
          updatedAt: new Date(),
          walletAddress: "testWalletAddress",
        } satisfies CachedConversation,
      });
    }).rejects.toThrow(
      "Conversation not found in XMTP client, unable to prepare message",
    );
  });

  it("should prepare a message for sending", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });

    const conversation = await client.conversations.newConversation(
      testWallet2.account.address,
      undefined,
    );

    const { message, preparedMessage } = await prepareMessageForSending({
      client,
      content: "test",
      contentType: ContentTypeText.toString(),
      conversation: toCachedConversation(
        conversation,
        testWallet1.account.address,
      ),
    });

    expect(message.content).toBe("test");
    expect(message.contentType).toBe(ContentTypeText.toString());
    expect(message.hasSendError).toBe(false);
    expect(message.isSending).toBe(true);
    expect(message.status).toBe("unprocessed");
    expect(message.walletAddress).toBe(testWallet1.account.address);
    expect(message.xmtpID).toBe(await preparedMessage.messageID());
  });

  it("should prepare a message for sending without a content type", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });

    const conversation = await client.conversations.newConversation(
      testWallet2.account.address,
      undefined,
    );

    const { message, preparedMessage } = await prepareMessageForSending({
      client,
      content: "test",
      conversation: toCachedConversation(
        conversation,
        testWallet1.account.address,
      ),
    });

    expect(message.content).toBe("test");
    expect(message.contentType).toBe(ContentTypeText.toString());
    expect(message.hasSendError).toBe(false);
    expect(message.isSending).toBe(true);
    expect(message.status).toBe("unprocessed");
    expect(message.walletAddress).toBe(testWallet1.account.address);
    expect(message.xmtpID).toBe(await preparedMessage.messageID());
  });
});

describe("updateMessageAfterSending", () => {
  it("should update specific properties of a message", async () => {
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: true,
      hasLoadError: false,
      hasSendError: false,
      sentAt: new Date(),
      status: "processed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    const cachedMessage = await saveMessage(testMessage, db);
    expect(cachedMessage).toEqual(testMessage);

    const sentAt = new Date();

    await updateMessageAfterSending(cachedMessage, sentAt, db);

    const updatedMessage = await getMessageByXmtpID("testXmtpId", db);

    expect(updatedMessage).toEqual({
      ...testMessage,
      sentAt,
      isSending: false,
      sendOptions: undefined,
    });
  });
});

describe("getLastMessage", () => {
  it("should get the last message of a conversation topic", async () => {
    const sentAt = new Date();
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "processed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid1",
      xmtpID: "testXmtpId1",
    } satisfies CachedMessage;

    const testMessage2 = {
      id: 2,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt: adjustDate(sentAt, 1000),
      status: "processed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid2",
      xmtpID: "testXmtpId2",
    } satisfies CachedMessage;

    const cachedMessage = await saveMessage(testMessage, db);
    expect(cachedMessage).toEqual(testMessage);
    const cachedMessage2 = await saveMessage(testMessage2, db);
    expect(cachedMessage2).toEqual(testMessage2);

    const lastMessage = await getLastMessage("testTopic", db);
    expect(lastMessage).toEqual(cachedMessage2);
  });
});

describe("getUnprocessedMessages", () => {
  it("should get all unprocessed messages", async () => {
    const sentAt = new Date();
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "processed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid1",
      xmtpID: "testXmtpId1",
    } satisfies CachedMessage;

    const testMessage2 = {
      id: 2,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: "text",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt: adjustDate(sentAt, 1000),
      status: "unprocessed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid2",
      xmtpID: "testXmtpId2",
    } satisfies CachedMessage;

    const cachedMessage = await saveMessage(testMessage, db);
    expect(cachedMessage).toEqual(testMessage);
    const cachedMessage2 = await saveMessage(testMessage2, db);
    expect(cachedMessage2).toEqual(testMessage2);

    const unprocessedMessages = await getUnprocessedMessages(db);
    expect(unprocessedMessages.length).toBe(1);
    expect(unprocessedMessages[0]).toEqual(testMessage2);
  });
});

describe("processMessage", () => {
  const mockProcessor1 = vi.fn<
    ArgumentsType<ContentTypeMessageProcessor>,
    Promise<void>
  >();
  const mockProcessor2 = vi.fn();
  const mockProcessor3 = vi.fn();
  const testNamepaces = {
    [ContentTypeText.toString()]: "text",
  };
  const testProcessors = {
    [ContentTypeText.toString()]: [mockProcessor1, mockProcessor2],
    foo: [mockProcessor3],
  };
  const testValidators = {};

  beforeEach(() => {
    mockProcessor1.mockReset();
    mockProcessor2.mockReset();
    mockProcessor3.mockReset();
  });

  it("should not process a message without a client", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });
    const conversation = await client.conversations.newConversation(
      testWallet2.account.address,
      undefined,
    );
    const cachedConversation = await saveConversation(
      toCachedConversation(conversation, testWallet1.account.address),
      db,
    );

    const sentAt = new Date();
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "unprocessed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    const { status, message: cachedMessage } = await processMessage({
      client: undefined,
      conversation: cachedConversation,
      db,
      message: testMessage,
      namespaces: testNamepaces,
      processors: testProcessors,
      validators: testValidators,
    });

    expect(status).toBe("no_client");
    expect(cachedMessage).toEqual(testMessage);
    expect(mockProcessor1).not.toHaveBeenCalled();
    expect(mockProcessor2).not.toHaveBeenCalled();
    expect(mockProcessor3).not.toHaveBeenCalled();

    const updatedConversation = await getCachedConversationByTopic(
      testWallet1.account.address,
      conversation.topic,
      db,
    );
    expect(updatedConversation?.updatedAt).not.toEqual(sentAt);

    const savedMessage = await getMessageByXmtpID("testXmtpId", db);
    expect(savedMessage).toBeUndefined();
  });

  it("should not process an already processed message", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });
    const conversation = await client.conversations.newConversation(
      testWallet2.account.address,
      undefined,
    );
    const cachedConversation = await saveConversation(
      toCachedConversation(conversation, testWallet1.account.address),
      db,
    );

    const sentAt = new Date();
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "processed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    await saveMessage(testMessage, db);

    const { status, message: cachedMessage } = await processMessage({
      client,
      conversation: cachedConversation,
      db,
      message: testMessage,
      namespaces: testNamepaces,
      processors: testProcessors,
      validators: testValidators,
    });

    expect(status).toBe("duplicate");
    expect(cachedMessage).toEqual(testMessage);
    expect(mockProcessor1).not.toHaveBeenCalled();
    expect(mockProcessor2).not.toHaveBeenCalled();
    expect(mockProcessor3).not.toHaveBeenCalled();

    const updatedConversation = await getCachedConversationByTopic(
      "testWalletAddress",
      "testTopic",
      db,
    );
    expect(updatedConversation?.updatedAt).not.toEqual(sentAt);
  });

  it("should not process a message with invalid content", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });
    const conversation = await client.conversations.newConversation(
      testWallet2.account.address,
      undefined,
    );
    const cachedConversation = await saveConversation(
      toCachedConversation(conversation, testWallet1.account.address),
      db,
    );

    const sentAt = new Date();
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: undefined,
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "processed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    const { status, message: cachedMessage } = await processMessage({
      client,
      conversation: cachedConversation,
      db,
      message: testMessage,
      namespaces: testNamepaces,
      processors: testProcessors,
      validators: textContentTypeConfig.validators ?? {},
    });

    expect(status).toBe("invalid");
    expect(cachedMessage).toEqual(testMessage);
    expect(mockProcessor1).not.toHaveBeenCalled();
    expect(mockProcessor2).not.toHaveBeenCalled();
    expect(mockProcessor3).not.toHaveBeenCalled();

    const updatedConversation = await getCachedConversationByTopic(
      "testWalletAddress",
      "testTopic",
      db,
    );
    expect(updatedConversation?.updatedAt).not.toEqual(sentAt);
  });

  it("should process an unprocessed message with a supported content type", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });
    const conversation = await client.conversations.newConversation(
      testWallet2.account.address,
      undefined,
    );
    const cachedConversation = await saveConversation(
      toCachedConversation(conversation, testWallet1.account.address),
      db,
    );

    const sentAt = new Date();
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test",
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "unprocessed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    const { status, message: cachedMessage } = await processMessage({
      client,
      conversation: cachedConversation,
      db,
      message: testMessage,
      namespaces: testNamepaces,
      processors: testProcessors,
      validators: testValidators,
    });

    expect(status).toBe("processed");
    expect(cachedMessage).toEqual({
      ...testMessage,
      status: "processed",
    });
    expect(mockProcessor1).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessor1.mock.calls[0][0].client).toBe(client);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessor1.mock.calls[0][0].conversation).toBe(
      cachedConversation,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessor1.mock.calls[0][0].db).toBe(db);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessor1.mock.calls[0][0].message).toBe(testMessage);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessor1.mock.calls[0][0].processors).toBe(testProcessors);
    expect(mockProcessor2).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessor2.mock.calls[0][0].client).toBe(client);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessor2.mock.calls[0][0].conversation).toBe(
      cachedConversation,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessor2.mock.calls[0][0].db).toBe(db);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessor2.mock.calls[0][0].message).toBe(testMessage);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessor2.mock.calls[0][0].processors).toBe(testProcessors);
    expect(mockProcessor3).not.toHaveBeenCalled();

    const updatedConversation = await getCachedConversationByTopic(
      testWallet1.account.address,
      conversation.topic,
      db,
    );
    expect(updatedConversation?.updatedAt).toEqual(sentAt);

    const savedMessage = await getMessageByXmtpID("testXmtpId", db);
    expect(savedMessage).toEqual({
      ...testMessage,
      status: "processed",
    });

    const testMessage2 = {
      id: 2,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: "test2",
      contentType: ContentTypeText.toString(),
      isSending: true,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "unprocessed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid2",
      xmtpID: "testXmtpId2",
    } satisfies CachedMessage;

    const { status: status2, message: cachedMessage2 } = await processMessage({
      client,
      conversation: cachedConversation,
      db,
      message: testMessage2,
      namespaces: testNamepaces,
      processors: testProcessors,
      validators: testValidators,
    });

    expect(status2).toBe("processed");
    expect(cachedMessage2).toEqual({
      ...testMessage2,
      status: "processed",
    });

    const updatedConversation2 = await getCachedConversationByTopic(
      testWallet1.account.address,
      conversation.topic,
      db,
    );
    expect(updatedConversation2?.updatedAt).toEqual(sentAt);
  });

  it("should cache but not process unsupported content types", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });
    const conversation = await client.conversations.newConversation(
      testWallet2.account.address,
      undefined,
    );
    const cachedConversation = await saveConversation(
      toCachedConversation(conversation, testWallet1.account.address),
      db,
    );

    const sentAt = new Date();
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: undefined,
      contentType: "foo",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "unprocessed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    const { status, message: cachedMessage } = await processMessage(
      {
        client,
        conversation: cachedConversation,
        db,
        message: testMessage,
        namespaces: testNamepaces,
        processors: testProcessors,
        validators: testValidators,
      },
      true,
    );

    expect(status).toBe("unsupported");
    expect(cachedMessage).toEqual(testMessage);
    expect(mockProcessor1).not.toHaveBeenCalled();
    expect(mockProcessor2).not.toHaveBeenCalled();
    expect(mockProcessor3).not.toHaveBeenCalled();

    const savedMessage = await getMessageByXmtpID("testXmtpId", db);
    expect(savedMessage).toEqual(testMessage);
  });

  it("should update the conversation metadata of a cached message if updateConversationMetadata is called in its processor", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });
    const conversation = await client.conversations.newConversation(
      testWallet2.account.address,
      undefined,
    );
    const cachedConversation = await saveConversation(
      toCachedConversation(conversation, testWallet1.account.address),
      db,
    );

    const sentAt = new Date();
    const testMessage = {
      id: 1,
      walletAddress: client.address,
      conversationTopic: conversation.topic,
      content: "test",
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "unprocessed",
      senderAddress: client.address,
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    mockProcessor1.mockImplementation(
      async ({ updateConversationMetadata }) => {
        await updateConversationMetadata({
          foo: "bar",
        });
      },
    );
    const { status, message: cachedMessage } = await processMessage({
      client,
      conversation: cachedConversation,
      db,
      message: testMessage,
      namespaces: testNamepaces,
      processors: testProcessors,
      validators: testValidators,
    });

    expect(status).toBe("processed");
    expect(cachedMessage).toEqual({
      ...testMessage,
      status: "processed",
    });
    expect(mockProcessor1).toHaveBeenCalledTimes(1);
    expect(mockProcessor2).toHaveBeenCalledTimes(1);
    expect(mockProcessor3).not.toHaveBeenCalled();

    const updatedConversation = await getCachedConversationByTopic(
      client.address,
      conversation.topic,
      db,
    );

    expect(updatedConversation).toEqual({
      ...cachedConversation,
      updatedAt: sentAt,
      metadata: {
        [testNamepaces[ContentTypeText.toString()]]: {
          foo: "bar",
        },
      },
    });
  });
});

describe("reprocessMessage", () => {
  const testNamepaces = {
    [ContentTypeText.toString()]: "text",
    foo: "bar",
  };
  const testProcessors = {
    [ContentTypeText.toString()]: [() => Promise.resolve()],
    foo: [() => Promise.resolve()],
  };
  const testValidators = {};

  const processMessageMock = vi.fn();
  const decodeContentMock = vi.fn();
  beforeEach(() => {
    processMessageMock.mockReset();
    decodeContentMock.mockReset();
  });

  it("should reprocess a message under certain conditions", async () => {
    const testClient = await Client.create(testWallet1, { env: "local" });
    const createdAt = new Date();
    const testConversation = {
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      topic: "testTopic",
      peerAddress: "testPeerAddress",
      walletAddress: "testWalletAddress",
    } satisfies CachedConversation;
    const sentAt = adjustDate(createdAt, 1000);
    const contentBytes = new TextEncoder().encode("test");
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: undefined,
      contentBytes,
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "unprocessed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;
    decodeContentMock.mockImplementation((bytes: Uint8Array) => ({
      content: new TextDecoder().decode(bytes),
    }));
    await reprocessMessage({
      client: testClient,
      conversation: testConversation,
      db,
      message: testMessage,
      namespaces: testNamepaces,
      processors: testProcessors,
      validators: testValidators,
      decode: decodeContentMock,
      process: processMessageMock,
    });
    expect(decodeContentMock).toHaveBeenCalledWith(contentBytes, testClient);
    expect(processMessageMock).toHaveBeenCalledWith(
      {
        client: testClient,
        conversation: testConversation,
        db,
        message: {
          ...testMessage,
          content: "test",
          contentBytes: undefined,
        },
        namespaces: testNamepaces,
        processors: testProcessors,
        validators: testValidators,
      },
      true,
    );
  });

  it("should not reprocess a message with unsupported content", async () => {
    const testClient = await Client.create(testWallet1, { env: "local" });
    const createdAt = new Date();
    const testConversation = {
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      topic: "testTopic",
      peerAddress: "testPeerAddress",
      walletAddress: "testWalletAddress",
    } satisfies CachedConversation;
    const sentAt = adjustDate(createdAt, 1000);
    const contentBytes = new TextEncoder().encode("foo");
    const testMessage = {
      id: 1,
      walletAddress: "testWalletAddress",
      conversationTopic: "testTopic",
      content: undefined,
      contentBytes,
      contentType: "foo",
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "unprocessed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;
    decodeContentMock.mockImplementation(() => ({
      content: undefined,
    }));
    await reprocessMessage({
      client: testClient,
      conversation: testConversation,
      db,
      message: testMessage,
      namespaces: testNamepaces,
      processors: testProcessors,
      validators: testValidators,
      decode: decodeContentMock,
      process: processMessageMock,
    });
    expect(decodeContentMock).toHaveBeenCalledWith(contentBytes, testClient);
    expect(processMessageMock).not.toHaveBeenCalled();
  });
});

describe("processUnprocessedMessages", () => {
  it("should process unprocessed messages", async () => {
    const testClient = await Client.create(testWallet1, { env: "local" });
    const createdAt = new Date();
    const sentAt = adjustDate(createdAt, 1000);
    const testConversation = {
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      topic: "testTopic",
      peerAddress: "testPeerAddress",
      walletAddress: testWallet1.account.address,
    } satisfies CachedConversation;
    const cachedConversation = await saveConversation(testConversation, db);
    const testMessage1 = {
      id: 1,
      walletAddress: testWallet1.account.address,
      conversationTopic: "testTopic",
      content: "test",
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "unprocessed",
      senderAddress: testWallet1.account.address,
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;
    await saveMessage(testMessage1, db);
    const testMessage2 = {
      id: 1,
      walletAddress: testWallet1.account.address,
      conversationTopic: "testTopic",
      content: "test",
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "processed",
      senderAddress: testWallet1.account.address,
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;
    await saveMessage(testMessage2, db);
    const mockReprocessMessage = vi.fn();
    const namespaces = {
      [ContentTypeText.toString()]: "text",
    };
    const processors = {
      [ContentTypeText.toString()]: [() => Promise.resolve()],
    };
    const validators = {};
    await processUnprocessedMessages({
      client: testClient,
      db,
      namespaces,
      processors,
      validators,
      reprocess: mockReprocessMessage,
    });
    expect(mockReprocessMessage).toHaveBeenCalledTimes(1);
    expect(mockReprocessMessage).toHaveBeenCalledWith({
      conversation: cachedConversation,
      client: testClient,
      db,
      message: testMessage1,
      namespaces,
      processors,
      validators,
    });
  });

  it("should not process unprocessed messages without a conversation", async () => {
    const testClient = await Client.create(testWallet1, { env: "local" });
    const createdAt = new Date();
    const sentAt = adjustDate(createdAt, 1000);
    const testMessage1 = {
      id: 1,
      walletAddress: testWallet1.account.address,
      conversationTopic: "testTopic",
      content: "test",
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt,
      status: "unprocessed",
      senderAddress: testWallet1.account.address,
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;
    await saveMessage(testMessage1, db);
    const mockReprocessMessage = vi.fn();
    const namespaces = {
      [ContentTypeText.toString()]: "text",
    };
    const processors = {
      [ContentTypeText.toString()]: [() => Promise.resolve()],
    };
    const validators = {};
    await processUnprocessedMessages({
      client: testClient,
      db,
      namespaces,
      processors,
      validators,
      reprocess: mockReprocessMessage,
    });
    expect(mockReprocessMessage).not.toHaveBeenCalled();
  });
});

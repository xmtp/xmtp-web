import { it, expect, describe, vi, beforeEach } from "vitest";
import { Client, ContentTypeText } from "@xmtp/xmtp-js";
import type { ReadReceipt } from "@xmtp/content-type-read-receipt";
import {
  ContentTypeReadReceipt,
  ReadReceiptCodec,
} from "@xmtp/content-type-read-receipt";
import subSeconds from "date-fns/subSeconds";
import { type CachedMessageWithId } from "@/helpers/caching/messages";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import {
  saveConversation,
  type CachedConversationWithId,
} from "@/helpers/caching/conversations";
import {
  getReadReceipt,
  hasReadReceipt,
  processReadReceipt,
  readReceiptContentTypeConfig,
} from "@/helpers/caching/contentTypes/readReceipt";
import { createRandomWallet } from "@/helpers/testing";

const testWallet = createRandomWallet();
const db = getDbInstance({
  contentTypeConfigs: [readReceiptContentTypeConfig],
});

describe("ContentTypeReadReceipt caching", () => {
  beforeEach(async () => {
    await clearCache(db);
  });

  it("should have the correct content types config", () => {
    expect(readReceiptContentTypeConfig.namespace).toEqual("readReceipt");
    expect(readReceiptContentTypeConfig.codecs?.length).toEqual(1);
    expect(readReceiptContentTypeConfig.codecs?.[0]).toBeInstanceOf(
      ReadReceiptCodec,
    );
    expect(
      readReceiptContentTypeConfig.processors?.[
        ContentTypeReadReceipt.toString()
      ],
    ).toEqual([processReadReceipt]);
  });

  describe("processReadReceipt", () => {
    it("should update conversation metadata with timestamp", async () => {
      const testClient = await Client.create(testWallet, { env: "local" });
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.account.address,
      } satisfies CachedConversationWithId;

      await saveConversation(testConversation, db);

      const sentAt = new Date();

      const testReadReceiptMessage = {
        id: 1,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: {},
        contentType: ContentTypeReadReceipt.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt,
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId<ReadReceipt>;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processReadReceipt({
        client: testClient,
        conversation: testConversation,
        db,
        message: testReadReceiptMessage,
        persist,
        updateConversationMetadata,
        processors: readReceiptContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
      expect(updateConversationMetadata).toHaveBeenCalledWith(
        sentAt.toISOString(),
      );
    });

    it("should ignore read receipts that come before the current one", async () => {
      const testClient = await Client.create(testWallet, { env: "local" });
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.account.address,
      } satisfies CachedConversationWithId;

      await saveConversation(testConversation, db);

      const sentAt = new Date();
      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();

      const testReadReceiptMessage = {
        id: 1,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: {},
        contentType: ContentTypeReadReceipt.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt,
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId<ReadReceipt>;

      await processReadReceipt({
        client: testClient,
        conversation: testConversation,
        db,
        message: testReadReceiptMessage,
        persist,
        updateConversationMetadata,
        processors: readReceiptContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
      expect(updateConversationMetadata).toHaveBeenCalledWith(
        sentAt.toISOString(),
      );

      const testReadReceiptMessage2 = {
        id: 2,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: {},
        contentType: ContentTypeReadReceipt.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: subSeconds(sentAt, 1),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId<ReadReceipt>;

      await processReadReceipt({
        client: testClient,
        conversation: testConversation,
        db,
        message: testReadReceiptMessage2,
        persist,
        updateConversationMetadata,
        processors: readReceiptContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
      expect(updateConversationMetadata).toHaveBeenCalledWith(
        sentAt.toISOString(),
      );
    });

    it("should ignore a read receipt from same client", async () => {
      const testClient = await Client.create(testWallet, { env: "local" });
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.account.address,
      } satisfies CachedConversationWithId;
      const testMessage = {
        id: 1,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: {},
        contentType: ContentTypeReadReceipt.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: testClient.address,
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processReadReceipt({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: readReceiptContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
      expect(updateConversationMetadata).not.toHaveBeenCalled();
    });

    it("should not process a message with the wrong content type", async () => {
      const testClient = await Client.create(testWallet, { env: "local" });
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.account.address,
      } satisfies CachedConversationWithId;
      const testTextMessage = {
        id: 1,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: "test",
        contentType: ContentTypeText.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processReadReceipt({
        client: testClient,
        conversation: testConversation,
        db,
        message: testTextMessage,
        persist,
        updateConversationMetadata,
        processors: readReceiptContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
      expect(updateConversationMetadata).not.toHaveBeenCalled();
    });
  });

  describe("getReadReceipt", () => {
    it("should return read receipt if conversation has one", () => {
      const readReceiptDate = new Date();
      const testConversationWithReadReceipt = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.account.address,
        metadata: {
          readReceipt: readReceiptDate.toISOString(),
        },
      } satisfies CachedConversationWithId;

      expect(getReadReceipt(testConversationWithReadReceipt)).toEqual(
        readReceiptDate,
      );
    });

    it("should not return read receipt if conversation does not have one", () => {
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.account.address,
      } satisfies CachedConversationWithId;
      expect(getReadReceipt(testConversation)).toBe(undefined);
    });
  });

  describe("hasReadReceipt", () => {
    it("should return true if conversation has a read receipt", () => {
      const testConversationWithReadReceipt = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.account.address,
        metadata: {
          readReceipt: new Date().toString(),
        },
      } satisfies CachedConversationWithId;

      expect(hasReadReceipt(testConversationWithReadReceipt)).toBe(true);
    });

    it("should return false if conversation does not have a read receipt", () => {
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.account.address,
      } satisfies CachedConversationWithId;
      expect(hasReadReceipt(testConversation)).toBe(false);
    });
  });
});

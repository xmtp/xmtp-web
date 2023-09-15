import { it, expect, describe, vi, beforeEach } from "vitest";
import { Client, ContentTypeText } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import type { ReadReceipt } from "@xmtp/content-type-read-receipt";
import {
  ContentTypeReadReceipt,
  ReadReceiptCodec,
} from "@xmtp/content-type-read-receipt";
import { type CachedMessageWithId } from "@/helpers/caching/messages";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import {
  type CachedConversationWithId,
  processConversation,
} from "@/helpers/caching/conversations";
import {
  getReadReceipt,
  hasReadReceipt,
  processReadReceipt,
  readReceiptContentTypeConfig,
} from "@/helpers/caching/contentTypes/readReceipt";

const testWallet = Wallet.createRandom();
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
    it("should update conversation in cache", async () => {
      const testClient = await Client.create(testWallet, { env: "local" });
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.address,
      } satisfies CachedConversationWithId;

      await processConversation({
        client: testClient,
        conversation: testConversation,
        db,
      });

      const readReceiptDate = new Date();

      const testReadReceiptContent = {
        timestamp: readReceiptDate.toString(),
      } satisfies ReadReceipt;

      const testReadReceiptMessage = {
        id: 1,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: testReadReceiptContent,
        contentType: ContentTypeReadReceipt.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
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
      });
      expect(persist).not.toHaveBeenCalled();
      expect(updateConversationMetadata).toHaveBeenCalledWith(
        readReceiptDate.toString(),
      );
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
        walletAddress: testWallet.address,
      } satisfies CachedConversationWithId;
      const testTextMessage = {
        id: 1,
        walletAddress: testWallet.address,
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
        walletAddress: testWallet.address,
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
        walletAddress: testWallet.address,
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
        walletAddress: testWallet.address,
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
        walletAddress: testWallet.address,
      } satisfies CachedConversationWithId;
      expect(hasReadReceipt(testConversation)).toBe(false);
    });
  });
});

import { it, expect, describe, vi, beforeEach } from "vitest";
import { Client, ContentTypeText } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import type { Reply } from "@xmtp/content-type-reply";
import { ContentTypeReply, ReplyCodec } from "@xmtp/content-type-reply";
import {
  processReply,
  hasReply,
  replyContentTypeConfig,
  getReplies,
  getOriginalMessageFromReply,
  addReply,
} from "./reply";
import {
  saveMessage,
  type CachedMessageWithId,
  getMessageByXmtpID,
} from "@/helpers/caching/messages";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import type { CachedConversationWithId } from "@/helpers/caching/conversations";

const testWallet = Wallet.createRandom();
const db = getDbInstance({
  contentTypeConfigs: [replyContentTypeConfig],
});

describe("ContentTypeReply caching", () => {
  beforeEach(async () => {
    await clearCache(db);
  });

  it("should have the correct content types config", () => {
    expect(replyContentTypeConfig.namespace).toEqual("replies");
    expect(replyContentTypeConfig.codecs?.length).toEqual(1);
    expect(replyContentTypeConfig.codecs?.[0]).toBeInstanceOf(ReplyCodec);
    expect(
      replyContentTypeConfig.processors[ContentTypeReply.toString()],
    ).toEqual([processReply]);
  });

  describe("processReply", () => {
    it("should add the reply and message to the cache", async () => {
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
        hasSendError: false,
        sentAt: new Date(),
        status: "processed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId;

      await saveMessage(testTextMessage, db);

      const testReplyContent = {
        content: "test",
        contentType: ContentTypeText,
        reference: "testXmtpId1",
      } satisfies Reply;

      const testReplyMessage = {
        id: 2,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: testReplyContent,
        contentType: ContentTypeReply.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "processed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid2",
        xmtpID: "testXmtpId2",
      } satisfies CachedMessageWithId<Reply>;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processReply({
        client: testClient,
        conversation: testConversation,
        db,
        message: testReplyMessage,
        persist,
        updateConversationMetadata,
        processors: replyContentTypeConfig.processors,
      });
      expect(persist).toHaveBeenCalledWith();
      // since we mocked persist, we need to manually save the message
      await saveMessage(testReplyMessage, db);

      const originalMessage = await getMessageByXmtpID("testXmtpId1", db);
      const replies = getReplies(originalMessage!);
      expect(replies.length).toEqual(1);
      expect(replies).toEqual(["testXmtpId2"]);
      expect(hasReply(originalMessage!)).toBe(true);

      const replyMessage = await getMessageByXmtpID("testXmtpId2", db);
      const originalMessageFromReply = await getOriginalMessageFromReply(
        replyMessage!,
        db,
      );
      expect(originalMessageFromReply).toEqual(originalMessage);
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
      const testMessage = {
        id: 1,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: "test",
        contentType: ContentTypeText.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid",
        xmtpID: "testXmtpId",
      } satisfies CachedMessageWithId;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processReply({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: replyContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
    });
  });

  describe("getOriginalMessageFromReply", () => {
    it("should return undefined if the message isn't a processed reply", async () => {
      const testTextMessage = {
        id: 1,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: "test",
        contentType: ContentTypeText.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "processed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId;

      const originalMessageFromReply = await getOriginalMessageFromReply(
        testTextMessage,
        db,
      );
      expect(originalMessageFromReply).toBeUndefined();

      const testReplyMessage = {
        id: 2,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: {
          content: "test",
          contentType: ContentTypeText,
          reference: "testXmtpId1",
        },
        contentType: ContentTypeReply.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid2",
        xmtpID: "testXmtpId2",
      } satisfies CachedMessageWithId<Reply>;

      const originalMessageFromReply2 = await getOriginalMessageFromReply(
        testReplyMessage,
        db,
      );
      expect(originalMessageFromReply2).toBeUndefined();
    });
  });

  describe("getReplies", () => {
    it("should return empty array if no metadata is present", () => {
      const testTextMessage = {
        id: 1,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: "test",
        contentType: ContentTypeText.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "processed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId;

      const replies = getReplies(testTextMessage);
      expect(replies).toEqual([]);
    });
  });

  describe("addReply", () => {
    it("should create multiple replies in message metadata", async () => {
      const testTextMessage = {
        id: 1,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: "test",
        contentType: ContentTypeText.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "processed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId;

      await saveMessage(testTextMessage, db);
      await addReply("testXmtpId1", "testXmtpId2", db);
      await addReply("testXmtpId1", "testXmtpId3", db);

      const textMessage = await getMessageByXmtpID("testXmtpId1", db);

      const replies = getReplies(textMessage!);
      expect(replies).toEqual(["testXmtpId2", "testXmtpId3"]);
    });
  });
});

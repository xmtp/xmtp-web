import { it, expect, describe, vi, beforeEach } from "vitest";
import { Client } from "@xmtp/xmtp-js";
import type { Reply } from "@xmtp/content-type-reply";
import { ContentTypeReply, ReplyCodec } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
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
import type { CachedConversation } from "@/helpers/caching/conversations";
import { createRandomWallet } from "@/helpers/testing";

const testWallet = createRandomWallet();
const db = getDbInstance({
  contentTypeConfigs: [replyContentTypeConfig],
});

describe("ContentTypeReply", () => {
  beforeEach(async () => {
    await clearCache(db);
  });

  it("should have the correct content types config", () => {
    expect(replyContentTypeConfig.namespace).toEqual("replies");
    expect(replyContentTypeConfig.codecs?.length).toEqual(1);
    expect(replyContentTypeConfig.codecs?.[0]).toBeInstanceOf(ReplyCodec);
    expect(replyContentTypeConfig.contentTypes).toEqual([
      ContentTypeReply.toString(),
    ]);
    expect(
      replyContentTypeConfig.processors?.[ContentTypeReply.toString()],
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
        walletAddress: testWallet.account.address,
      } satisfies CachedConversation;
      const testTextMessage = {
        id: 1,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: "test",
        contentType: ContentTypeText.toString(),
        isSending: false,
        hasSendError: false,
        hasLoadError: false,
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
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: testReplyContent,
        contentType: ContentTypeReply.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "processed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid2",
        xmtpID: "testXmtpId2",
      } satisfies CachedMessageWithId<Reply>;

      await saveMessage(testReplyMessage, db);

      const updateConversationMetadata = vi.fn();
      await processReply({
        client: testClient,
        conversation: testConversation,
        db,
        message: testReplyMessage,
        updateConversationMetadata,
        processors: replyContentTypeConfig.processors,
      });

      const originalMessage = await getMessageByXmtpID("testXmtpId1", db);
      const replies = await getReplies(originalMessage!, db);
      expect(replies.length).toEqual(1);
      expect(replies).toEqual([testReplyMessage]);
      expect(await hasReply(originalMessage!, db)).toBe(true);

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
        walletAddress: testWallet.account.address,
      } satisfies CachedConversation;
      const testMessage = {
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
        uuid: "testUuid",
        xmtpID: "testXmtpId",
      } satisfies CachedMessageWithId;

      const updateConversationMetadata = vi.fn();
      await processReply({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        updateConversationMetadata,
        processors: replyContentTypeConfig.processors,
      });
    });
  });

  describe("getOriginalMessageFromReply", () => {
    it("should return undefined if the message isn't a processed reply", async () => {
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
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: {
          content: "test",
          contentType: ContentTypeText,
          reference: "testXmtpId1",
        },
        contentType: ContentTypeReply.toString(),
        isSending: false,
        hasLoadError: false,
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
    it("should return empty array if no metadata is present", async () => {
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
        status: "processed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId;

      const replies = await getReplies(testTextMessage, db);
      expect(replies).toEqual([]);
    });
  });

  describe("addReply", () => {
    it("should create multiple replies", async () => {
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
        status: "processed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid1",
        xmtpID: "testXmtpId1",
      } satisfies CachedMessageWithId;

      const testReplyMessage1 = {
        id: 2,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: {
          content: "foo",
          contentType: ContentTypeText,
          reference: "testXmtpId1",
        } satisfies Reply,
        contentType: ContentTypeReply.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "processed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid2",
        xmtpID: "testXmtpId2",
      } satisfies CachedMessageWithId;

      await saveMessage(testReplyMessage1, db);

      const testReplyMessage2 = {
        id: 3,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: {
          content: "bar",
          contentType: ContentTypeText,
          reference: "testXmtpId1",
        } satisfies Reply,
        contentType: ContentTypeReply.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "processed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid3",
        xmtpID: "testXmtpId3",
      } satisfies CachedMessageWithId;

      await saveMessage(testReplyMessage2, db);

      await addReply("testXmtpId1", "testXmtpId2", db);
      await addReply("testXmtpId1", "testXmtpId3", db);

      const replies = await getReplies(testTextMessage, db);
      expect(replies).toEqual([testReplyMessage1, testReplyMessage2]);
    });
  });
});

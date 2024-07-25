import { it, expect, describe, vi, beforeEach } from "vitest";
import { Client } from "@xmtp/xmtp-js";
import type { Reaction } from "@xmtp/content-type-reaction";
import {
  ContentTypeReaction,
  ReactionCodec,
} from "@xmtp/content-type-reaction";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { CachedReaction, CachedReactionsTable } from "./reaction";
import {
  reactionContentTypeConfig,
  processReaction,
  getReactionsByXmtpID,
  hasReaction,
  saveReaction,
} from "./reaction";
import {
  saveMessage,
  type CachedMessage,
  getMessageByXmtpID,
} from "@/helpers/caching/messages";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import type { CachedConversation } from "@/helpers/caching/conversations";
import { createRandomWallet } from "@/helpers/testing";

const testWallet = createRandomWallet();
const db = await getDbInstance({
  contentTypeConfigs: [reactionContentTypeConfig],
});

describe("ContentTypeReaction", () => {
  beforeEach(async () => {
    await clearCache(db);
  });

  it("should have the correct content types config", () => {
    expect(reactionContentTypeConfig.namespace).toEqual("reactions");
    expect(reactionContentTypeConfig.codecs?.length).toEqual(1);
    expect(reactionContentTypeConfig.codecs?.[0]).toBeInstanceOf(ReactionCodec);
    expect(
      reactionContentTypeConfig.processors?.[ContentTypeReaction.toString()],
    ).toEqual([processReaction]);
  });

  describe("saveReaction", () => {
    it("should save a reaction to the cache", async () => {
      const firstSentAt = new Date();
      const testReaction = {
        content: "test",
        referenceXmtpID: "foo",
        schema: "custom",
        senderAddress: "testWalletAddress",
        sentAt: firstSentAt,
        id: "test1",
      } satisfies CachedReaction;

      const reactionId = await saveReaction(testReaction, db);
      expect(reactionId).toEqual("test1");

      const testReactions = await getReactionsByXmtpID("foo", db);
      expect(testReactions.length).toEqual(1);
      expect(testReactions[0].sentAt).toEqual(firstSentAt);

      const secondSentAt = new Date();
      const testReaction2 = {
        content: "test",
        referenceXmtpID: "foo",
        schema: "custom",
        senderAddress: "testWalletAddress",
        sentAt: secondSentAt,
        id: "test2",
      } satisfies CachedReaction;

      const reactionId2 = await saveReaction(testReaction2, db);
      expect(reactionId2).toEqual("test2");

      const testReactions2 = await getReactionsByXmtpID("foo", db);
      expect(testReactions2.length).toEqual(2);
      expect(testReactions2[1].sentAt).toEqual(secondSentAt);
    });
  });

  describe("processReaction", () => {
    it("should add and remove reactions to the cache", async () => {
      const testClient = await Client.create(testWallet, { env: "local" });
      const testConversation = {
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.account.address,
      } satisfies CachedConversation;
      const testTextMessage = {
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
        id: "test3",
      } satisfies CachedMessage;

      await saveMessage(testTextMessage, db);

      const testReactionContent = {
        content: "test",
        schema: "custom",
        action: "added",
        reference: "test3",
      } satisfies Reaction;

      const testReactionMessage = {
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: testReactionContent,
        contentType: ContentTypeReaction.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid2",
        id: "test4",
      } satisfies CachedMessage<Reaction>;

      const updateConversationMetadata = vi.fn();
      await processReaction({
        client: testClient,
        conversation: testConversation,
        db,
        message: testReactionMessage,
        updateConversationMetadata,
        processors: reactionContentTypeConfig.processors,
      });

      const reactions = await getReactionsByXmtpID("test3", db);
      expect(reactions.length).toEqual(1);
      expect(reactions[0].content).toEqual(testReactionContent.content);
      expect(reactions[0].referenceXmtpID).toEqual(
        testReactionContent.reference,
      );
      expect(reactions[0].schema).toEqual(testReactionContent.schema);
      expect(reactions[0].senderAddress).toBe("testWalletAddress");
      expect(reactions[0].id).toEqual("test4");

      const originalMessage = await getMessageByXmtpID("test3", db);
      expect(hasReaction(originalMessage!)).toBe(true);

      const testReactionMessage2 = {
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: {
          ...testReactionContent,
          action: "removed",
        },
        contentType: ContentTypeReaction.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid3",
        id: "testXmtpId3",
      } satisfies CachedMessage<Reaction>;

      await processReaction({
        client: testClient,
        conversation: testConversation,
        db,
        message: testReactionMessage2,
        updateConversationMetadata,
        processors: reactionContentTypeConfig.processors,
      });

      const reactions2 = await getReactionsByXmtpID("testXmtpId1", db);
      expect(reactions2.length).toEqual(0);

      const originalMessage2 = await getMessageByXmtpID("testXmtpId1", db);
      expect(hasReaction(originalMessage2!)).toBe(false);
    });

    it("should not process a message with the wrong content type", async () => {
      const testClient = await Client.create(testWallet, { env: "local" });
      const testConversation = {
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.account.address,
      } satisfies CachedConversation;
      const testMessage = {
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
        id: "test5",
      } satisfies CachedMessage;

      const updateConversationMetadata = vi.fn();
      await processReaction({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        updateConversationMetadata,
        processors: reactionContentTypeConfig.processors,
      });
      const reactionsTable = db.table("reactions") as CachedReactionsTable;
      const allReactions = await reactionsTable.toArray();
      expect(allReactions.length).toEqual(0);
    });
  });
});

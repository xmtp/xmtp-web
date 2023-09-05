import { it, expect, describe, vi, beforeEach } from "vitest";
import { Client, ContentTypeText } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import type { Reaction } from "@xmtp/content-type-reaction";
import {
  ContentTypeReaction,
  ReactionCodec,
} from "@xmtp/content-type-reaction";
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
  type CachedMessageWithId,
  getMessageByXmtpID,
} from "@/helpers/caching/messages";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import type { CachedConversationWithId } from "@/helpers/caching/conversations";

const testWallet = Wallet.createRandom();
const db = getDbInstance({
  contentTypeConfigs: [reactionContentTypeConfig],
});

describe("ContentTypeReaction caching", () => {
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
      const testReaction = {
        content: "test",
        referenceXmtpID: "testXmtpId",
        schema: "custom",
        senderAddress: "testWalletAddress",
        xmtpID: "testXmtpId",
      } satisfies CachedReaction;

      const reactionId = await saveReaction(testReaction, db);
      expect(reactionId).toEqual(1);

      const testReaction2 = {
        content: "test",
        referenceXmtpID: "testXmtpId",
        schema: "custom",
        senderAddress: "testWalletAddress",
        xmtpID: "testXmtpId",
      } satisfies CachedReaction;

      const reactionId2 = await saveReaction(testReaction2, db);
      expect(reactionId2).toEqual(1);
    });
  });

  describe("processReaction", () => {
    it("should add and remove reactions to the cache", async () => {
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

      await saveMessage(testTextMessage, db);

      const testReactionContent = {
        content: "test",
        schema: "custom",
        action: "added",
        reference: "testXmtpId1",
      } satisfies Reaction;

      const testReactionMessage = {
        id: 2,
        walletAddress: testWallet.address,
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
        xmtpID: "testXmtpId2",
      } satisfies CachedMessageWithId<Reaction>;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processReaction({
        client: testClient,
        conversation: testConversation,
        db,
        message: testReactionMessage,
        persist,
        updateConversationMetadata,
        processors: reactionContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();

      const reactions = await getReactionsByXmtpID("testXmtpId1", db);
      expect(reactions.length).toEqual(1);
      expect(reactions[0].content).toEqual(testReactionContent.content);
      expect(reactions[0].referenceXmtpID).toEqual(
        testReactionContent.reference,
      );
      expect(reactions[0].schema).toEqual(testReactionContent.schema);
      expect(reactions[0].senderAddress).toBe("testWalletAddress");
      expect(reactions[0].xmtpID).toEqual("testXmtpId2");

      const originalMessage = await getMessageByXmtpID("testXmtpId1", db);
      expect(hasReaction(originalMessage!)).toBe(true);

      const testReactionMessage2 = {
        id: 3,
        walletAddress: testWallet.address,
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
        xmtpID: "testXmtpId3",
      } satisfies CachedMessageWithId<Reaction>;

      await processReaction({
        client: testClient,
        conversation: testConversation,
        db,
        message: testReactionMessage2,
        persist,
        updateConversationMetadata,
        processors: reactionContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();

      const reactions2 = await getReactionsByXmtpID("testXmtpId1", db);
      expect(reactions2.length).toEqual(0);

      const originalMessage2 = await getMessageByXmtpID("testXmtpId1", db);
      expect(hasReaction(originalMessage2!)).toBe(false);
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
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid",
        xmtpID: "testXmtpId",
      } satisfies CachedMessageWithId;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processReaction({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: reactionContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
      const reactionsTable = db.table("reactions") as CachedReactionsTable;
      const allReactions = await reactionsTable.toArray();
      expect(allReactions.length).toEqual(0);
    });
  });
});

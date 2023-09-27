import { it, expect, describe, vi } from "vitest";
import { Client, ContentTypeText } from "@xmtp/xmtp-js";
import {
  ContentTypeAttachment,
  type Attachment,
} from "@xmtp/content-type-remote-attachment";
import { type CachedMessageWithId } from "@/helpers/caching/messages";
import { getDbInstance } from "@/helpers/caching/db";
import type { CachedConversationWithId } from "@/helpers/caching/conversations";
import {
  processText,
  textContentTypeConfig,
} from "@/helpers/caching/contentTypes/text";
import { createRandomWallet } from "@/helpers/testing";

const testWallet = createRandomWallet();
const db = getDbInstance();

describe("ContentTypeText caching", () => {
  it("should have the correct content types config", () => {
    expect(textContentTypeConfig.namespace).toEqual("text");
    expect(textContentTypeConfig.codecs).toEqual([]);
    expect(
      textContentTypeConfig.processors?.[ContentTypeText.toString()],
    ).toEqual([processText]);
  });

  describe("processText", () => {
    it("should save a message to the cache", async () => {
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
      await processText({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: textContentTypeConfig.processors,
      });
      expect(persist).toHaveBeenCalledWith();
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
      const testMessage = {
        id: 1,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: {
          filename: "testFilename",
          mimeType: "testMimeType",
          data: new Uint8Array(),
        },
        contentType: ContentTypeAttachment.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid",
        xmtpID: "testXmtpId",
      } satisfies CachedMessageWithId<Attachment>;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processText({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: textContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
    });
  });
});

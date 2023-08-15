import { it, expect, describe, vi } from "vitest";
import type {
  Attachment,
  RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import {
  AttachmentCodec,
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { Client, ContentTypeText } from "@xmtp/xmtp-js";
// eslint-disable-next-line import/no-extraneous-dependencies
import { Wallet } from "ethers";
import {
  getAttachment,
  hasAttachment,
  processAttachment,
  processRemoteAttachment,
  attachmentsCacheConfig,
} from "./attachment";
import { type CachedMessageWithId } from "@/helpers/caching/messages";
import { getDbInstance } from "@/helpers/caching/db";
import type { CachedConversationWithId } from "@/helpers/caching/conversations";

const testWallet = Wallet.createRandom();
const db = getDbInstance({
  cacheConfig: [attachmentsCacheConfig],
});

describe("ContentTypeRemoteAttachment caching", () => {
  it("should have the correct cache config", () => {
    expect(attachmentsCacheConfig.namespace).toEqual("attachment");
    expect(attachmentsCacheConfig.codecs?.length).toEqual(2);
    expect(attachmentsCacheConfig.codecs?.[0]).toBeInstanceOf(AttachmentCodec);
    expect(attachmentsCacheConfig.codecs?.[1]).toBeInstanceOf(
      RemoteAttachmentCodec,
    );
    expect(
      attachmentsCacheConfig.processors[ContentTypeAttachment.toString()],
    ).toEqual([processAttachment]);
    expect(
      attachmentsCacheConfig.processors[ContentTypeRemoteAttachment.toString()],
    ).toEqual([processRemoteAttachment]);
  });

  describe("processAttachment", () => {
    it("should save a message to the cache with attachment metadata", async () => {
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
        content: {
          filename: "testFilename",
          mimeType: "testMimeType",
          data: new Uint8Array(),
        },
        contentType: ContentTypeAttachment.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid",
        xmtpID: "testXmtpId",
      } satisfies CachedMessageWithId<Attachment>;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processAttachment({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: attachmentsCacheConfig.processors,
      });
      expect(persist).toHaveBeenCalledWith({
        metadata: testMessage.content,
      });
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
      await processAttachment({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: attachmentsCacheConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
    });
  });

  describe("processRemoteAttachment", () => {
    it("should save a message to the cache with attachment metadata", async () => {
      const testMetadata = {
        filename: "testFilename",
        mimeType: "testMimeType",
        data: new Uint8Array(),
      } satisfies Attachment;
      const spy = vi
        .spyOn(RemoteAttachmentCodec, "load")
        .mockImplementationOnce(async () => Promise.resolve(testMetadata));
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
        content: {
          contentDigest: "testContentDigest",
          contentLength: 0,
          filename: "testFilename",
          nonce: new Uint8Array(),
          salt: new Uint8Array(),
          scheme: "testScheme",
          secret: new Uint8Array(),
          url: "testUrl",
        },
        contentType: ContentTypeRemoteAttachment.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid",
        xmtpID: "testXmtpId",
      } satisfies CachedMessageWithId<RemoteAttachment>;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processRemoteAttachment({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: attachmentsCacheConfig.processors,
      });
      expect(spy).toHaveBeenCalledWith(testMessage.content, testClient);
      expect(persist).toHaveBeenCalledWith({
        metadata: testMetadata,
      });
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
      await processRemoteAttachment({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: attachmentsCacheConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
    });
  });

  describe("getAttachment", () => {
    it("should return an attachment from cached message metadata (if present)", () => {
      const testMetadata = {
        filename: "testFilename",
        mimeType: "testMimeType",
        data: new Uint8Array(),
      } satisfies Attachment;
      const testMessage = {
        id: 1,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: testMetadata,
        contentType: ContentTypeAttachment.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid",
        xmtpID: "testXmtpId",
        metadata: {
          [attachmentsCacheConfig.namespace]: testMetadata,
        },
      } satisfies CachedMessageWithId<Attachment>;

      const attachment = getAttachment(testMessage);
      expect(attachment).toEqual(testMetadata);

      const attachment2 = getAttachment({
        ...testMessage,
        metadata: {},
      });
      expect(attachment2).toBeUndefined();
    });
  });

  describe("hasAttachment", () => {
    it("should return true if attachment metadata exists", () => {
      const testMetadata = {
        filename: "testFilename",
        mimeType: "testMimeType",
        data: new Uint8Array(),
      } satisfies Attachment;
      const testMessage = {
        id: 1,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: testMetadata,
        contentType: ContentTypeAttachment.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid",
        xmtpID: "testXmtpId",
        metadata: {
          [attachmentsCacheConfig.namespace]: testMetadata,
        },
      } satisfies CachedMessageWithId<Attachment>;

      const attachment = hasAttachment(testMessage);
      expect(attachment).toBe(true);

      const attachment2 = hasAttachment({
        ...testMessage,
        metadata: {},
      });
      expect(attachment2).toBe(false);
    });
  });
});

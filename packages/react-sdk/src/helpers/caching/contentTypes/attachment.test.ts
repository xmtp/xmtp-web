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
import {
  getAttachment,
  hasAttachment,
  processAttachment,
  processRemoteAttachment,
  attachmentContentTypeConfig,
} from "./attachment";
import { type CachedMessageWithId } from "@/helpers/caching/messages";
import { getDbInstance } from "@/helpers/caching/db";
import type { CachedConversationWithId } from "@/helpers/caching/conversations";
import { createRandomWallet } from "@/helpers/testing";

const testWallet = createRandomWallet();
const db = getDbInstance({
  contentTypeConfigs: [attachmentContentTypeConfig],
});

describe("ContentTypeRemoteAttachment caching", () => {
  it("should have the correct content types config", () => {
    expect(attachmentContentTypeConfig.namespace).toEqual("attachment");
    expect(attachmentContentTypeConfig.codecs?.length).toEqual(2);
    expect(attachmentContentTypeConfig.codecs?.[0]).toBeInstanceOf(
      AttachmentCodec,
    );
    expect(attachmentContentTypeConfig.codecs?.[1]).toBeInstanceOf(
      RemoteAttachmentCodec,
    );
    expect(
      attachmentContentTypeConfig.processors?.[
        ContentTypeAttachment.toString()
      ],
    ).toEqual([processAttachment]);
    expect(
      attachmentContentTypeConfig.processors?.[
        ContentTypeRemoteAttachment.toString()
      ],
    ).toEqual([processRemoteAttachment]);
  });

  describe("processAttachment", () => {
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
      await processAttachment({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: attachmentContentTypeConfig.processors,
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
      await processAttachment({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: attachmentContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
    });
  });

  describe("processRemoteAttachment", () => {
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
        hasLoadError: false,
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
        processors: attachmentContentTypeConfig.processors,
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
      await processRemoteAttachment({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: attachmentContentTypeConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
    });
  });

  describe("getAttachment", () => {
    it("should return an attachment from cached message", () => {
      const testContent = {
        filename: "testFilename",
        mimeType: "testMimeType",
        data: new Uint8Array(),
      } satisfies Attachment;
      const testMessage = {
        id: 1,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: testContent,
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

      const attachment = getAttachment(testMessage);
      expect(attachment).toEqual(testContent);

      const testContent2 = {
        url: "testUrl",
        contentDigest: "testContentDigest",
        salt: new Uint8Array(),
        nonce: new Uint8Array(),
        secret: new Uint8Array(),
        scheme: "testScheme",
        contentLength: 0,
        filename: "testFilename",
      } satisfies RemoteAttachment;
      const testMessage2 = {
        id: 2,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: testContent2,
        contentType: ContentTypeRemoteAttachment.toString(),
        isSending: false,
        hasLoadError: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid",
        xmtpID: "testXmtpId",
      } satisfies CachedMessageWithId<RemoteAttachment>;

      const attachment2 = getAttachment(testMessage2);
      expect(attachment2).toEqual(testContent2);

      const testMessage3 = {
        id: 3,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: "foo",
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

      const attachment3 = getAttachment(testMessage3);
      expect(attachment3).toBeUndefined();
    });
  });

  describe("hasAttachment", () => {
    it("should return true if message is an attachment content type", () => {
      const testContent = {
        filename: "testFilename",
        mimeType: "testMimeType",
        data: new Uint8Array(),
      } satisfies Attachment;
      const testMessage = {
        id: 1,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: testContent,
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

      const attachment = hasAttachment(testMessage);
      expect(attachment).toBe(true);

      const testMessage2 = {
        id: 2,
        walletAddress: testWallet.account.address,
        conversationTopic: "testTopic",
        content: "foo",
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

      const attachment2 = hasAttachment(testMessage2);
      expect(attachment2).toBe(false);
    });
  });
});

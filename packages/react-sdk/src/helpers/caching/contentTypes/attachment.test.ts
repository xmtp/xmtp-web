import { it, expect, describe } from "vitest";
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
import { ContentTypeText } from "@xmtp/content-type-text";
import {
  getAttachment,
  hasAttachment,
  attachmentContentTypeConfig,
} from "./attachment";
import { type CachedMessage } from "@/helpers/caching/messages";
import { createRandomWallet } from "@/helpers/testing";

const testWallet = createRandomWallet();

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
      } satisfies CachedMessage<Attachment>;

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
      } satisfies CachedMessage<RemoteAttachment>;

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
      } satisfies CachedMessage;

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
      } satisfies CachedMessage<Attachment>;

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
      } satisfies CachedMessage;

      const attachment2 = hasAttachment(testMessage2);
      expect(attachment2).toBe(false);
    });
  });
});

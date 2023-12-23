import { it, expect, describe, vi, beforeEach } from "vitest";
import { Client, ContentTypeText, ContentTypeId } from "@xmtp/xmtp-js";
import { saveMessage, getMessageByXmtpID } from "@/helpers/caching/messages";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import type { CachedMessageWithId } from "@/helpers/caching/messages";
import { createRandomWallet } from "@/helpers/testing";

// Create a unique identifier for your content type
const ContentTypeMultiplyNumbers = new ContentTypeId({
  authorityId: "your.domain",
  typeId: "multiply-number",
  versionMajor: 1,
  versionMinor: 0,
});

// Define the MultiplyCodec class
class ContentTypeMultiplyNumberCodec {
  get contentType() {
    return ContentTypeMultiplyNumbers;
  }

  // The encode method accepts an object with two numbers (a, b) and encodes it as a byte array
  encode({ a, b }: { a: number; b: number }) {
    return {
      type: ContentTypeMultiplyNumbers,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify({ a, b })),
    };
  }

  // The decode method decodes the byte array, parses the string into numbers (a, b), and returns their product
  decode(content: { content: any }) {
    const uint8Array = content.content;
    const { a, b } = JSON.parse(new TextDecoder().decode(uint8Array));
    return a * b;
  }

  fallback(content: number): string | undefined {
    return `Can’t display number content types. Number was ${JSON.stringify(
      content,
    )}`;
    // return undefined; if you don't want the content type to be displayed.
  }
}

const testWallet = createRandomWallet();
const db = getDbInstance();

describe("ContentTypeMultiplyNumberCodec", () => {
  beforeEach(async () => {
    await clearCache(db);
  });

  it("should encode and decode numbers correctly", () => {
    const codec = new ContentTypeMultiplyNumberCodec();
    const numbers = { a: 2, b: 3 };
    const encoded = codec.encode(numbers);
    const decoded = codec.decode(encoded);
    expect(decoded).toEqual(6);
  });

  it("should handle known content types", async () => {
    const testClient = await Client.create(testWallet, { env: "local" });
    const testMessage = {
      id: 1,
      walletAddress: testWallet.account.address,
      conversationTopic: "testTopic",
      content: { a: 2, b: 3 },
      contentType: ContentTypeMultiplyNumberCodec.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt: new Date(),
      status: "unprocessed",
      senderAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessageWithId;

    await saveMessage(testMessage, db);
    const savedMessage = await getMessageByXmtpID("testXmtpId", db);
    expect(savedMessage).toBeTruthy();
    expect(savedMessage!.content).toEqual(6);
  });

  it("should handle unknown content types", async () => {
    const testClient = await Client.create(testWallet, { env: "local" });
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

    await saveMessage(testMessage, db);
    const savedMessage = await getMessageByXmtpID("testXmtpId", db);
    expect(savedMessage).toBeTruthy();
    expect(savedMessage!.content).toEqual("test");
  });
});

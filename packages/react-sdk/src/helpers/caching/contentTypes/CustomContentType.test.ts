import { it, expect, describe, vi, beforeEach } from "vitest";
import { Client, DecodedMessage, ContentTypeId } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
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

export const multiplyNumbersContentTypeConfig: ContentTypeConfiguration = {
  codecs: [new ContentTypeMultiplyNumberCodec()],
  contentTypes: [ContentTypeMultiplyNumbers.toString()],
  namespace: "multiplyNumbers", // Replace with the actual namespace you are using
  processors: {
    [ContentTypeMultiplyNumbers.toString()]: [processMultiplyNumbers],
  },
  validators: {
    [ContentTypeMultiplyNumbers.toString()]: isValidMultiplyNumbersContent,
  },
};

// You'll need to define the processMultiplyNumbers and isValidMultiplyNumbersContent functions
// These should be tailored to handle the specific logic of processing and validating
// the content type for multiplying numbers.

function processMultiplyNumbers(content) {
  // Define how to process the multiply numbers content
  // Example: logging, storing, or manipulating the data
}

function isValidMultiplyNumbersContent(content) {
  // Define validation logic for multiply numbers content
  // Example: checking if the numbers are valid, not null, etc.
}

const db = getDbInstance();

describe("ContentTypeMultiplyNumberCodec", () => {
  beforeEach(async () => {
    await clearCache(db);
  });
  it("should have the correct content types config", () => {
    expect(multiplyNumbersContentTypeConfig.namespace).toEqual(
      "multiplyNumbers",
    );
    expect(multiplyNumbersContentTypeConfig.codecs?.length).toEqual(1);
    expect(multiplyNumbersContentTypeConfig.codecs?.[0]).toBeInstanceOf(
      ContentTypeMultiplyNumberCodec,
    );
    expect(multiplyNumbersContentTypeConfig.contentTypes).toEqual([
      ContentTypeMultiplyNumbers.toString(),
    ]);
    expect(
      multiplyNumbersContentTypeConfig.processors?.[
        ContentTypeMultiplyNumbers.toString()
      ],
    ).toEqual([processMultiplyNumbers]);
    expect(
      multiplyNumbersContentTypeConfig.validators?.[
        ContentTypeMultiplyNumbers.toString()
      ],
    ).toEqual(isValidMultiplyNumbersContent);
  });

  it("should encode and decode numbers correctly", () => {
    const codec = new ContentTypeMultiplyNumberCodec();
    const numbers = { a: 2, b: 3 };
    const encoded = codec.encode(numbers);
    const decoded = codec.decode(encoded);
    expect(decoded).toEqual(6);
  }); /*
  it("should handle known content types", async () => {
    const testWallet = Wallet.createRandom();
    const testClient = await Client.create(testWallet, { env: "local" });
  }); */
  
});

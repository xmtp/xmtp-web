import { it, expect, describe, beforeEach } from "vitest";
import { ContentTypeId } from "@xmtp/xmtp-js";
import { getDbInstance, clearCache } from "@/helpers/caching/db";

// Create a unique identifier for your content type
const ContentTypeMultiplyNumbers = new ContentTypeId({
  authorityId: "your.domain",
  typeId: "multiply-number",
  versionMajor: 1,
  versionMinor: 0,
});

// Define the MultiplyCodec class
class ContentTypeMultiplyNumberCodec {
  // eslint-disable-next-line class-methods-use-this
  get contentType() {
    return ContentTypeMultiplyNumbers;
  }

  // The encode method accepts an object with two numbers (a, b) and encodes it as a byte array
  // eslint-disable-next-line class-methods-use-this
  encode = ({ a, b }: { a: number; b: number }) => ({
    type: ContentTypeMultiplyNumbers,
    parameters: {},
    content: new TextEncoder().encode(JSON.stringify({ a, b })),
  });

  // The decode method decodes the byte array, parses the string into numbers (a, b), and returns their product
  // eslint-disable-next-line class-methods-use-this
  decode = (content: { content: Uint8Array }) => {
    const uint8Array = content.content;
    const { a, b } = JSON.parse(new TextDecoder().decode(uint8Array)) as {
      a: number;
      b: number;
    };
    return a * b;
  };

  // eslint-disable-next-line class-methods-use-this
  fallback = (content: number): string | undefined =>
    `Can’t display number content types. Number was ${JSON.stringify(content)}`;
  // return undefined; if you don't want the content type to be displayed.
}

export const multiplyNumbersContentTypeConfig = {
  codecs: [new ContentTypeMultiplyNumberCodec()],
  contentTypes: [ContentTypeMultiplyNumbers.toString()],
  namespace: "multiplyNumbers", // Replace with the actual namespace you are using
  processors: {
    [ContentTypeMultiplyNumbers.toString()]: [],
  },
  validators: {
    [ContentTypeMultiplyNumbers.toString()]: [],
  },
};

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
    ).toEqual([]);
    expect(
      multiplyNumbersContentTypeConfig.validators?.[
        ContentTypeMultiplyNumbers.toString()
      ],
    ).toEqual([]);
  });

  it("should encode and decode numbers correctly", () => {
    const codec = new ContentTypeMultiplyNumberCodec();
    const numbers = { a: 2, b: 3 };
    const encoded = codec.encode(numbers);
    const decoded = codec.decode(encoded);
    expect(decoded).toEqual(6);
  });
});

import { it, expect, describe } from "vitest";
import { ContentTypeText } from "@xmtp/xmtp-js";
import { combineValidators } from "@/helpers/combineValidators";
import { attachmentsCacheConfig } from "@/helpers/caching/contentTypes/attachment";
import { reactionsCacheConfig } from "@/helpers/caching/contentTypes/reaction";
import { readReceiptsCacheConfig } from "@/helpers/caching/contentTypes/readReceipt";
import { repliesCacheConfig } from "@/helpers/caching/contentTypes/reply";
import { textCacheConfig } from "@/helpers/caching/contentTypes/text";

const testCacheConfig = [
  attachmentsCacheConfig,
  reactionsCacheConfig,
  readReceiptsCacheConfig,
  repliesCacheConfig,
];

describe("combineValidators", () => {
  it("should combine content validators from a cache config", () => {
    expect(combineValidators(testCacheConfig)).toEqual({
      ...attachmentsCacheConfig.validators,
      ...reactionsCacheConfig.validators,
      ...readReceiptsCacheConfig.validators,
      ...repliesCacheConfig.validators,
      ...textCacheConfig.validators,
    });
  });

  it("should only have a text content validator without a cache config", () => {
    expect(combineValidators()).toEqual(textCacheConfig.validators);
  });

  it("should throw when there's a duplicate content type validator", () => {
    expect(() =>
      combineValidators([
        {
          namespace: "foo",
          processors: {},
          validators: {
            [ContentTypeText.toString()]: () => false,
          },
        },
      ]),
    ).toThrow(
      `Duplicate content validator detected for content type "${ContentTypeText.toString()}"`,
    );
  });
});

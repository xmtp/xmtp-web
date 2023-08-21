import { it, expect, describe } from "vitest";
import { ContentTypeText } from "@xmtp/xmtp-js";
import { combineValidators } from "@/helpers/combineValidators";
import { attachmentContentTypeConfig } from "@/helpers/caching/contentTypes/attachment";
import { reactionContentTypeConfig } from "@/helpers/caching/contentTypes/reaction";
import { readReceiptContentTypeConfig } from "@/helpers/caching/contentTypes/readReceipt";
import { replyContentTypeConfig } from "@/helpers/caching/contentTypes/reply";
import { textContentTypeConfig } from "@/helpers/caching/contentTypes/text";

const testCacheConfig = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  readReceiptContentTypeConfig,
  replyContentTypeConfig,
];

describe("combineValidators", () => {
  it("should combine content validators from a content types config", () => {
    expect(combineValidators(testCacheConfig)).toEqual({
      ...attachmentContentTypeConfig.validators,
      ...reactionContentTypeConfig.validators,
      ...readReceiptContentTypeConfig.validators,
      ...replyContentTypeConfig.validators,
      ...textContentTypeConfig.validators,
    });
  });

  it("should only have a text content validator without a content types config", () => {
    expect(combineValidators()).toEqual(textContentTypeConfig.validators);
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

import { it, expect, describe } from "vitest";
import { ContentTypeText } from "@xmtp/content-type-text";
import {
  isValidTextContent,
  textContentTypeConfig,
} from "@/helpers/caching/contentTypes/text";

describe("ContentTypeText", () => {
  it("should have the correct config", () => {
    expect(textContentTypeConfig.namespace).toEqual("text");
    expect(textContentTypeConfig.codecs).toEqual([]);
    expect(textContentTypeConfig.contentTypes).toEqual([
      ContentTypeText.toString(),
    ]);
    expect(textContentTypeConfig.validators).toEqual({
      [ContentTypeText.toString()]: isValidTextContent,
    });
  });
});

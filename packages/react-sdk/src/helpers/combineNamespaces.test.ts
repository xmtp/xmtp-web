import { it, expect, describe } from "vitest";
import {
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { combineNamespaces } from "@/helpers/combineNamespaces";
import { attachmentContentTypeConfig } from "@/helpers/caching/contentTypes/attachment";
import { reactionContentTypeConfig } from "@/helpers/caching/contentTypes/reaction";
import { replyContentTypeConfig } from "@/helpers/caching/contentTypes/reply";

const testCacheConfig = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  replyContentTypeConfig,
];

describe("combineNamespaces", () => {
  it("should combine namespaces from a content types config", () => {
    expect(combineNamespaces(testCacheConfig)).toEqual({
      [ContentTypeAttachment.toString()]: "attachment",
      [ContentTypeRemoteAttachment.toString()]: "attachment",
      [ContentTypeReaction.toString()]: "reactions",
      [ContentTypeReply.toString()]: "replies",
      [ContentTypeText.toString()]: "text",
    });
  });

  it("should only have a text namespace without a content types config", () => {
    expect(combineNamespaces()).toEqual({
      [ContentTypeText.toString()]: "text",
    });
  });

  it("should throw when there's a duplicate namespace", () => {
    expect(() =>
      combineNamespaces([
        {
          namespace: "text",
          codecs: [],
          contentTypes: [ContentTypeText.toString()],
        },
      ]),
    ).toThrow(`Duplicate content types config namespace detected: "text"`);
  });
});

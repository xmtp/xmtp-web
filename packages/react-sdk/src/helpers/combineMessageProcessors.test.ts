import { it, expect, describe } from "vitest";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { combineMessageProcessors } from "@/helpers/combineMessageProcessors";
import { attachmentContentTypeConfig } from "@/helpers/caching/contentTypes/attachment";
import {
  processReaction,
  reactionContentTypeConfig,
} from "@/helpers/caching/contentTypes/reaction";
import {
  processReply,
  replyContentTypeConfig,
} from "@/helpers/caching/contentTypes/reply";

const testCacheConfig = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  replyContentTypeConfig,
];

describe("combineMessageProcessors", () => {
  it("should combine message processors from a content types config", () => {
    expect(combineMessageProcessors(testCacheConfig)).toEqual({
      [ContentTypeReaction.toString()]: [processReaction],
      [ContentTypeReply.toString()]: [processReply],
    });
  });

  it("should have no message processors without a content types config", () => {
    expect(combineMessageProcessors()).toEqual({});
  });
});

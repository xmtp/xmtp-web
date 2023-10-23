import { it, expect, describe } from "vitest";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { combineMessageProcessors } from "@/helpers/combineMessageProcessors";
import { attachmentContentTypeConfig } from "@/helpers/caching/contentTypes/attachment";
import {
  processReaction,
  reactionContentTypeConfig,
} from "@/helpers/caching/contentTypes/reaction";
import {
  processReadReceipt,
  readReceiptContentTypeConfig,
} from "@/helpers/caching/contentTypes/readReceipt";
import {
  processReply,
  replyContentTypeConfig,
} from "@/helpers/caching/contentTypes/reply";

const testCacheConfig = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  readReceiptContentTypeConfig,
  replyContentTypeConfig,
];

describe("combineMessageProcessors", () => {
  it("should combine message processors from a content types config", () => {
    expect(combineMessageProcessors(testCacheConfig)).toEqual({
      [ContentTypeReaction.toString()]: [processReaction],
      [ContentTypeReadReceipt.toString()]: [processReadReceipt],
      [ContentTypeReply.toString()]: [processReply],
    });
  });

  it("should have no message processors without a content types config", () => {
    expect(combineMessageProcessors()).toEqual({});
  });
});

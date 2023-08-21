import { it, expect, describe } from "vitest";
import {
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/xmtp-js";
import { combineMessageProcessors } from "@/helpers/combineMessageProcessors";
import {
  attachmentContentTypeConfig,
  processAttachment,
  processRemoteAttachment,
} from "@/helpers/caching/contentTypes/attachment";
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
import { processText } from "@/helpers/caching/contentTypes/text";

const testCacheConfig = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  readReceiptContentTypeConfig,
  replyContentTypeConfig,
];

describe("combineMessageProcessors", () => {
  it("should combine message processors from a content types config", () => {
    expect(combineMessageProcessors(testCacheConfig)).toEqual({
      [ContentTypeAttachment.toString()]: [processAttachment],
      [ContentTypeRemoteAttachment.toString()]: [processRemoteAttachment],
      [ContentTypeReaction.toString()]: [processReaction],
      [ContentTypeReadReceipt.toString()]: [processReadReceipt],
      [ContentTypeReply.toString()]: [processReply],
      [ContentTypeText.toString()]: [processText],
    });
  });

  it("should only have text message processors without a content types config", () => {
    expect(combineMessageProcessors()).toEqual({
      [ContentTypeText.toString()]: [processText],
    });
  });
});

import { it, expect, describe } from "vitest";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { ReadReceiptCodec } from "@xmtp/content-type-read-receipt";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { combineCodecs } from "@/helpers/combineCodecs";
import { attachmentContentTypeConfig } from "@/helpers/caching/contentTypes/attachment";
import { reactionContentTypeConfig } from "@/helpers/caching/contentTypes/reaction";
import { readReceiptContentTypeConfig } from "@/helpers/caching/contentTypes/readReceipt";
import { replyContentTypeConfig } from "@/helpers/caching/contentTypes/reply";

const testCacheConfig = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  readReceiptContentTypeConfig,
  replyContentTypeConfig,
];

describe("combineCodecs", () => {
  it("should combine codecs from a content types config", () => {
    expect(combineCodecs(testCacheConfig)).toEqual([
      new AttachmentCodec(),
      new RemoteAttachmentCodec(),
      new ReactionCodec(),
      new ReadReceiptCodec(),
      new ReplyCodec(),
    ]);
  });

  it("should have no codecs without a content types config", () => {
    expect(combineCodecs()).toEqual([]);
  });
});

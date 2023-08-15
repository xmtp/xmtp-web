import { it, expect, describe } from "vitest";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { ReadReceiptCodec } from "@xmtp/content-type-read-receipt";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { combineCodecs } from "@/helpers/combineCodecs";
import { attachmentsCacheConfig } from "@/helpers/caching/contentTypes/attachment";
import { reactionsCacheConfig } from "@/helpers/caching/contentTypes/reaction";
import { readReceiptsCacheConfig } from "@/helpers/caching/contentTypes/readReceipt";
import { repliesCacheConfig } from "@/helpers/caching/contentTypes/reply";

const testCacheConfig = [
  attachmentsCacheConfig,
  reactionsCacheConfig,
  readReceiptsCacheConfig,
  repliesCacheConfig,
];

describe("combineCodecs", () => {
  it("should combine codecs from a cache config", () => {
    expect(combineCodecs(testCacheConfig)).toEqual([
      new AttachmentCodec(),
      new RemoteAttachmentCodec(),
      new ReactionCodec(),
      new ReadReceiptCodec(),
      new ReplyCodec(),
    ]);
  });

  it("should have no codecs without a cache config", () => {
    expect(combineCodecs()).toEqual([]);
  });
});

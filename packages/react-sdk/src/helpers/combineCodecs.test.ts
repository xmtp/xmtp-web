import { it, expect, describe } from "vitest";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { combineCodecs } from "@/helpers/combineCodecs";
import { attachmentContentTypeConfig } from "@/helpers/caching/contentTypes/attachment";
import { reactionContentTypeConfig } from "@/helpers/caching/contentTypes/reaction";
import { replyContentTypeConfig } from "@/helpers/caching/contentTypes/reply";

const testCacheConfig = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  replyContentTypeConfig,
];

describe("combineCodecs", () => {
  it("should combine codecs from a content types config", () => {
    expect(combineCodecs(testCacheConfig)).toEqual([
      new AttachmentCodec(),
      new RemoteAttachmentCodec(),
      new ReactionCodec(),
      new ReplyCodec(),
    ]);
  });

  it("should have no codecs without a content types config", () => {
    expect(combineCodecs()).toEqual([]);
  });
});

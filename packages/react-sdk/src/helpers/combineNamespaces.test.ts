import { it, expect, describe } from "vitest";
import {
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/xmtp-js";
import { combineNamespaces } from "@/helpers/combineNamespaces";
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

describe("combineNamespaces", () => {
  it("should combine namespaces from a cache config", () => {
    expect(combineNamespaces(testCacheConfig)).toEqual({
      [ContentTypeAttachment.toString()]: "attachment",
      [ContentTypeRemoteAttachment.toString()]: "attachment",
      [ContentTypeReaction.toString()]: "reactions",
      [ContentTypeReadReceipt.toString()]: "readReceipt",
      [ContentTypeReply.toString()]: "replies",
      [ContentTypeText.toString()]: "text",
    });
  });

  it("should only have a text namespace without a cache config", () => {
    expect(combineNamespaces()).toEqual({
      [ContentTypeText.toString()]: "text",
    });
  });

  it("should throw when there's a duplicate namespace", () => {
    expect(() =>
      combineNamespaces([
        {
          namespace: "text",
          processors: {
            foo: [() => Promise.resolve()],
          },
        },
      ]),
    ).toThrow(`Duplicate cache config namespace detected: "text"`);
  });
});

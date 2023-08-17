import { ContentTypeId, ContentTypeText } from "@xmtp/xmtp-js";
import type { CacheConfiguration, CachedMessageProcessor } from "../db";

const NAMESPACE = "text";

export const processText: CachedMessageProcessor = async ({
  message,
  persist,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (ContentTypeText.sameAs(contentType)) {
    // no special processing, just persist the message to cache
    await persist();
  }
};

export const textCacheConfig: CacheConfiguration = {
  namespace: NAMESPACE,
  processors: {
    [ContentTypeText.toString()]: [processText],
  },
};

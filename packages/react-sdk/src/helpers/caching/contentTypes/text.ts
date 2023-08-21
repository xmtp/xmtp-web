import { ContentTypeId, ContentTypeText } from "@xmtp/xmtp-js";
import type {
  ContentTypeConfiguration,
  ContentTypeMessageProcessor,
} from "../db";

const NAMESPACE = "text";

/**
 * Validate the content of a text message
 *
 * @param content Message content
 * @returns `true` if the content is valid, `false` otherwise
 */
const isValidTextContent = (content: unknown) => typeof content === "string";

/**
 * Process a text message
 *
 * Saves the message to the cache.
 */
export const processText: ContentTypeMessageProcessor = async ({
  message,
  persist,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (
    ContentTypeText.sameAs(contentType) &&
    isValidTextContent(message.content)
  ) {
    // no special processing, just persist the message to cache
    await persist();
  }
};

export const textContentTypeConfig: ContentTypeConfiguration = {
  namespace: NAMESPACE,
  // the text codec is registered automatically in the JS SDK
  codecs: [],
  processors: {
    [ContentTypeText.toString()]: [processText],
  },
  validators: {
    [ContentTypeText.toString()]: isValidTextContent,
  },
};

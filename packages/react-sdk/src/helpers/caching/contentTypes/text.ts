import { ContentTypeText } from "@xmtp/content-type-text";
import type { ContentTypeConfiguration } from "../db";

const NAMESPACE = "text";

/**
 * Validate the content of a text message
 *
 * @param content Message content
 * @returns `true` if the content is valid, `false` otherwise
 */
export const isValidTextContent = (content: unknown) =>
  typeof content === "string";

export const textContentTypeConfig: ContentTypeConfiguration = {
  // the text codec is registered automatically in the JS SDK
  codecs: [],
  contentTypes: [ContentTypeText.toString()],
  namespace: NAMESPACE,
  validators: {
    [ContentTypeText.toString()]: isValidTextContent,
  },
};

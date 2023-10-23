import type {
  Attachment,
  RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import {
  AttachmentCodec,
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { z } from "zod";
import type Dexie from "dexie";
import type { ContentTypeConfiguration } from "../db";
import { updateMessageMetadata, type CachedMessage } from "../messages";

const NAMESPACE = "attachment";

/**
 * Get the attachment data from a cached message
 *
 * @param message Cached message
 * @returns The attachment data, or `undefined` if the message is not an
 * attachment content type
 */
export const getAttachment = (message: CachedMessage) => {
  switch (message.contentType) {
    case ContentTypeAttachment.toString():
      return message.content as Attachment;
    case ContentTypeRemoteAttachment.toString():
      return message.content as RemoteAttachment;
    default:
      return undefined;
  }
};

/**
 * Update the attachment data of a remote attachment message
 *
 * @param message Cached message
 * @param data The attachment data
 * @param db Database instance
 */
export const updateAttachmentData = async (
  message: CachedMessage,
  data: Attachment,
  db: Dexie,
) => {
  if (message.contentType === ContentTypeRemoteAttachment.toString()) {
    await updateMessageMetadata(message, NAMESPACE, data, db);
  }
};

/**
 * Get the attachment data from a remote attachment message
 *
 * @param message Cached message
 * @returns The attachment data, or `undefined` if the message is not an
 * attachment content type
 */
export const getRemoteAttachmentData = (message: CachedMessage) => {
  if (message.contentType === ContentTypeRemoteAttachment.toString()) {
    const metadata = message.metadata?.[NAMESPACE] as Attachment | undefined;
    return metadata;
  }
  return undefined;
};

/**
 * Check if a cached message has an attachment
 *
 * @param message Cached message
 * @returns `true` if the message has an attachment, `false` otherwise
 */
export const hasAttachment = (message: CachedMessage) => {
  const attachment = getAttachment(message);
  return !!attachment;
};

const AttachmentContentSchema = z.object({
  filename: z.string(),
  mimeType: z.string(),
  data: z.instanceof(Uint8Array),
});

/**
 * Validate the content of an attachment message
 *
 * @param content Message content
 * @returns `true` if the content is valid, `false` otherwise
 */
const isValidAttachmentContent = (content: unknown) => {
  const { success } = AttachmentContentSchema.safeParse(content);
  return success;
};

const RemoveAttachmentContentSchema = z.object({
  url: z.string(),
  contentDigest: z.string(),
  salt: z.instanceof(Uint8Array),
  nonce: z.instanceof(Uint8Array),
  secret: z.instanceof(Uint8Array),
  scheme: z.string(),
  contentLength: z.number().gte(0),
  filename: z.string(),
});

/**
 * Validate the content of a remote attachment message
 *
 * @param content Message content
 * @returns `true` if the content is valid, `false` otherwise
 */
const isValidRemoveAttachmentContent = (content: unknown) => {
  const { success } = RemoveAttachmentContentSchema.safeParse(content);
  return success;
};

export const attachmentContentTypeConfig: ContentTypeConfiguration = {
  codecs: [new AttachmentCodec(), new RemoteAttachmentCodec()],
  contentTypes: [
    ContentTypeAttachment.toString(),
    ContentTypeRemoteAttachment.toString(),
  ],
  namespace: NAMESPACE,
  validators: {
    [ContentTypeAttachment.toString()]: isValidAttachmentContent,
    [ContentTypeRemoteAttachment.toString()]: isValidRemoveAttachmentContent,
  },
};

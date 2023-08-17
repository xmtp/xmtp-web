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
import { ContentTypeId } from "@xmtp/xmtp-js";
import { z } from "zod";
import type { CacheConfiguration, CachedMessageProcessor } from "../db";
import { type CachedMessage } from "../messages";

const NAMESPACE = "attachment";

export type CachedAttachmentsMetadata = Attachment | undefined;

/**
 * Get the attachment data from a cached message
 *
 * @param message Cached message
 * @returns The attachment data, or `undefined` if the message has no attachment
 */
export const getAttachment = (message: CachedMessage) =>
  message?.metadata?.[NAMESPACE] as CachedAttachmentsMetadata;

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

/**
 * Process an attachment message
 *
 * The message content is also saved to the metadata of the message.
 */
export const processAttachment: CachedMessageProcessor = async ({
  message,
  persist,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (
    ContentTypeAttachment.sameAs(contentType) &&
    isValidAttachmentContent(message.content)
  ) {
    // save message to cache with the attachment metadata
    await persist({
      metadata: message.content as Attachment,
    });
  }
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

/**
 * Process a remote attachment message
 *
 * Loads the attachment from the remote URL and saves it to the metadata
 * of the message.
 */
export const processRemoteAttachment: CachedMessageProcessor = async ({
  client,
  message,
  persist,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (
    ContentTypeRemoteAttachment.sameAs(contentType) &&
    isValidRemoveAttachmentContent(message.content)
  ) {
    const attachment = await RemoteAttachmentCodec.load<Attachment>(
      message.content as RemoteAttachment,
      client,
    );

    // save message to cache with the attachment metadata
    await persist({
      metadata: attachment,
    });
  }
};

export const attachmentsCacheConfig: CacheConfiguration = {
  codecs: [new AttachmentCodec(), new RemoteAttachmentCodec()],
  namespace: NAMESPACE,
  processors: {
    [ContentTypeAttachment.toString()]: [processAttachment],
    [ContentTypeRemoteAttachment.toString()]: [processRemoteAttachment],
  },
  validators: {
    [ContentTypeAttachment.toString()]: isValidAttachmentContent,
    [ContentTypeRemoteAttachment.toString()]: isValidRemoveAttachmentContent,
  },
};

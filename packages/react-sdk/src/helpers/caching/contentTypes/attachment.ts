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
import type { CacheConfiguration, CachedMessageProcessor } from "../db";
import { type CachedMessage } from "../messages";

const NAMESPACE = "attachment";

export type CachedAttachmentsMetadata = Attachment | undefined;

export const hasAttachment = (message: CachedMessage) => {
  const metadata = message?.metadata?.[NAMESPACE] as CachedAttachmentsMetadata;
  return !!metadata;
};

export const getAttachment = (message: CachedMessage) =>
  message?.metadata?.[NAMESPACE] as CachedAttachmentsMetadata;

export const processAttachment: CachedMessageProcessor = async ({
  message,
  persist,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (ContentTypeAttachment.sameAs(contentType)) {
    // save message to cache with the attachment metadata
    await persist({
      metadata: message.content as Attachment,
    });
  }
};

export const processRemoteAttachment: CachedMessageProcessor = async ({
  client,
  message,
  persist,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  if (ContentTypeRemoteAttachment.sameAs(contentType)) {
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
};

import { useCallback, useEffect, useState } from "react";
import {
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import type {
  RemoteAttachment,
  Attachment,
} from "@xmtp/content-type-remote-attachment";
import { useDb } from "./useDb";
import { type CachedMessage } from "@/helpers/caching/messages";
import { useClient } from "@/hooks/useClient";
import {
  getAttachmentData,
  updateAttachmentData,
} from "@/helpers/caching/contentTypes/attachment";
import { useMessage } from "@/hooks/useMessage";

export type UseAttachmentOptions = {
  disableAutoload?: boolean;
  autoloadMaxFileSize?: number;
};

export type AttachmentStatus =
  | "init"
  | "loading"
  | "error"
  | "loaded"
  | "autoloadMaxFileSizeExceeded";

// 10MB
const defaultAutoloadMaxFileSize = 10 * 1024 * 1024;

/**
 * This hook returns the attachment data of a cached message
 */
export const useAttachment = (
  message: CachedMessage,
  options?: UseAttachmentOptions,
) => {
  const { client } = useClient();
  const { db } = useDb();
  const { updateMessage } = useMessage();
  const [error, setError] = useState<Error | undefined>(undefined);
  const [status, setStatus] = useState<AttachmentStatus>("init");
  const [attachment, setAttachment] = useState<Attachment | undefined>(
    undefined,
  );

  const {
    disableAutoload = false,
    autoloadMaxFileSize = defaultAutoloadMaxFileSize,
  } = options ?? {};

  const loadRemoteAttachment = useCallback(
    async (force: boolean = false) => {
      if (
        client &&
        message.contentType === ContentTypeRemoteAttachment.toString() &&
        // if the attachment already failed to load, don't automatically reload
        // unless forced
        ((message.hasLoadError && force) || !message.hasLoadError)
      ) {
        // check if attachment data is already cached
        const attachmentData = getAttachmentData(message);
        if (attachmentData) {
          setAttachment(attachmentData);
          setStatus("loaded");
          return;
        }

        try {
          setStatus("loading");
          const loadedAttachment = await RemoteAttachmentCodec.load<Attachment>(
            message.content as RemoteAttachment,
            client,
          );
          // cache attachment data
          try {
            await updateAttachmentData(message, loadedAttachment, db);
          } catch {
            // if this call fails, it's not a big deal
            // on the next load, the attachment data will be fetched again
          }
          setAttachment(loadedAttachment);
          setStatus("loaded");
        } catch (e) {
          setError(new Error("Unable to load remote attachment"));
          void updateMessage(message, { hasLoadError: true });
          setStatus("error");
        }
      } else {
        setError(
          new Error("XMTP client is required to load remote attachments"),
        );
        setStatus("error");
      }
    },
    [client, db, message, updateMessage],
  );

  const forceLoadRemoteAttachment = useCallback(() => {
    void loadRemoteAttachment(true);
  }, [loadRemoteAttachment]);

  useEffect(() => {
    const getAttachment = async () => {
      switch (message.contentType) {
        case ContentTypeAttachment.toString(): {
          setAttachment(message.content as Attachment);
          setStatus("loaded");
          break;
        }
        case ContentTypeRemoteAttachment.toString(): {
          const remoteAttachmentData = message.content as RemoteAttachment;
          if (remoteAttachmentData.contentLength > autoloadMaxFileSize) {
            setStatus("autoloadMaxFileSizeExceeded");
            return;
          }
          if (!disableAutoload) {
            await loadRemoteAttachment();
          }
          break;
        }
        default: {
          setError(new Error("Message is not an attachment content type"));
          setStatus("error");
        }
      }
    };
    void getAttachment();
  }, [autoloadMaxFileSize, db, disableAutoload, loadRemoteAttachment, message]);

  return {
    attachment,
    error,
    load: forceLoadRemoteAttachment,
    status,
  };
};

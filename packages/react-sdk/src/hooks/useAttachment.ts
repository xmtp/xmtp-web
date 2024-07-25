import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  getRemoteAttachmentData,
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
  const { getDbInstance } = useDb();
  const { updateMessage } = useMessage();
  const [error, setError] = useState<Error | undefined>(undefined);
  const [status, setStatus] = useState<AttachmentStatus>("init");
  const [attachment, setAttachment] = useState<Attachment | undefined>(
    undefined,
  );
  const getAttachmentRef = useRef(false);

  const {
    disableAutoload = false,
    autoloadMaxFileSize = defaultAutoloadMaxFileSize,
  } = options ?? {};

  // get remote attachment data from the cache
  const remoteAttachmentData = useMemo(
    () => getRemoteAttachmentData(message),
    [message],
  );

  const loadRemoteAttachment = useCallback(
    async (force: boolean = false) => {
      // check if attachment data is already cached
      if (remoteAttachmentData && status !== "loaded") {
        setAttachment(remoteAttachmentData);
        setStatus("loaded");
        return;
      }

      if (
        client &&
        message.contentType === ContentTypeRemoteAttachment.toString() &&
        !remoteAttachmentData &&
        status !== "loading" &&
        status !== "loaded" &&
        !attachment &&
        // if the attachment already failed to load, don't automatically reload
        // unless forced
        ((message.hasLoadError && force) || !message.hasLoadError)
      ) {
        try {
          setStatus("loading");
          const loadedAttachment = await RemoteAttachmentCodec.load<Attachment>(
            message.content as RemoteAttachment,
            client,
          );
          // cache attachment data
          try {
            const db = await getDbInstance();
            await updateAttachmentData(message, loadedAttachment, db);
          } catch {
            // if this call fails, it's not a big deal
            // on the next load, the attachment data will be fetched again
          }
          setAttachment(loadedAttachment);
          setStatus("loaded");
        } catch (e) {
          await updateMessage(message, { hasLoadError: true });
          setError(new Error("Unable to load remote attachment"));
          setStatus("error");
        }
      } else {
        setError(
          new Error("XMTP client is required to load remote attachments"),
        );
        setStatus("error");
      }
    },
    [
      remoteAttachmentData,
      status,
      client,
      message,
      attachment,
      getDbInstance,
      updateMessage,
    ],
  );

  const forceLoadRemoteAttachment = useCallback(() => {
    void loadRemoteAttachment(true);
  }, [loadRemoteAttachment]);

  useEffect(() => {
    const getAttachment = async () => {
      // prevent running this hook multiple times in parallel
      if (getAttachmentRef.current) {
        return;
      }

      getAttachmentRef.current = true;

      if (attachment || status === "loading" || status === "loaded") {
        return;
      }

      switch (message.contentType) {
        case ContentTypeAttachment.toString(): {
          setAttachment(message.content as Attachment);
          setStatus("loaded");
          getAttachmentRef.current = false;
          break;
        }
        case ContentTypeRemoteAttachment.toString(): {
          // check if attachment data is already cached
          if (remoteAttachmentData) {
            setAttachment(remoteAttachmentData);
            setStatus("loaded");
            getAttachmentRef.current = false;
            return;
          }
          const attachmentData = message.content as RemoteAttachment;
          if (attachmentData.contentLength > autoloadMaxFileSize) {
            setStatus("autoloadMaxFileSizeExceeded");
            getAttachmentRef.current = false;
            return;
          }
          if (!disableAutoload) {
            await loadRemoteAttachment();
          }
          getAttachmentRef.current = false;
          break;
        }
        default: {
          setError(new Error("Message is not an attachment content type"));
          setStatus("error");
          getAttachmentRef.current = false;
        }
      }
    };
    void getAttachment();
  }, [
    remoteAttachmentData,
    autoloadMaxFileSize,
    disableAutoload,
    loadRemoteAttachment,
    message,
    attachment,
    status,
  ]);

  return {
    attachment,
    error,
    load: forceLoadRemoteAttachment,
    status,
  };
};

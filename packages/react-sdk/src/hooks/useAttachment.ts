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
import type { CachedMessage } from "@/helpers/caching/messages";
import { useClient } from "@/hooks/useClient";

/**
 * This hook returns the attachment data of a cached message
 */
export const useAttachment = (message: CachedMessage) => {
  const { client } = useClient();
  const { db } = useDb();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [attachment, setAttachment] = useState<Attachment | undefined>(
    undefined,
  );

  const loadRemoteAttachment = useCallback(async () => {
    if (client) {
      try {
        setIsLoading(true);
        const loadedAttachment = await RemoteAttachmentCodec.load<Attachment>(
          message.content as RemoteAttachment,
          client,
        );
        setIsLoading(false);
        setAttachment(loadedAttachment);
      } catch (e) {
        setError(new Error("Unable to load remote attachment"));
      }
    } else {
      setError(new Error("XMTP client is required to load remote attachments"));
    }
  }, [client, message.content]);

  useEffect(() => {
    const getAttachment = async () => {
      switch (message.contentType) {
        case ContentTypeAttachment.toString(): {
          setAttachment(message.content as Attachment);
          break;
        }
        case ContentTypeRemoteAttachment.toString(): {
          await loadRemoteAttachment();
          break;
        }
        default:
          setError(new Error("Message is not an attachment content type"));
      }
    };
    void getAttachment();
  }, [db, loadRemoteAttachment, message]);

  return {
    attachment,
    error,
    isLoading,
    retry: loadRemoteAttachment,
  };
};

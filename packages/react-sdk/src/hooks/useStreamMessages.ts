import type { DecodedMessage, Stream } from "@xmtp/xmtp-js";
import { useEffect, useRef, useState } from "react";
import type { OnError } from "../sharedTypes";
import { toCachedMessage } from "../helpers/caching/messages";
import {
  getConversationByTopic,
  type CachedConversation,
} from "@/helpers/caching/conversations";
import { useClient } from "./useClient";
import { useMessage } from "@/hooks/useMessage";

export type MessageStream = Promise<Stream<DecodedMessage>>;

export type UseStreamMessagesOptions = {
  onError?: OnError["onError"];
  onMessage?: (message: DecodedMessage) => void;
};

/**
 * This hook streams new conversation messages on mount and exposes an error state.
 */
export const useStreamMessages = (
  conversation: CachedConversation,
  options?: UseStreamMessagesOptions,
) => {
  const [error, setError] = useState<Error | null>(null);
  const streamRef = useRef<MessageStream | undefined>(undefined);
  const endStreamRef = useRef(async (stream?: MessageStream) => {
    // it's important to reset the stream reference first so that any
    // subsequent mounts can restart the stream
    if (streamRef.current) {
      streamRef.current = undefined;
    }
    if (stream !== undefined) {
      void (await stream).return();
    }
  });
  const { processMessage } = useMessage();
  const { client } = useClient();

  // destructure options for more granular dependency array
  const { onError, onMessage } = options ?? {};

  // attempt to stream conversation messages on mount
  useEffect(() => {
    // conversation and client are required
    if (!conversation || !client) {
      const clientError = new Error(
        "XMTP client and/or conversation is not available",
      );
      setError(clientError);
      onError?.(clientError);
      return () => {};
    }

    // ensure references to the stream and end stream function are available during cleanup
    let stream = streamRef.current;
    const endStream = endStreamRef.current;

    const streamMessages = async () => {
      // don't start a stream if there's already one active
      if (streamRef.current) {
        return;
      }

      const networkConversation = await getConversationByTopic(
        conversation.topic,
        client,
      );

      // don't start a stream if there's no network conversation
      if (!networkConversation) {
        // TODO: should this throw instead?
        return;
      }

      try {
        // check if stream exists again just in case this hook unmounted
        // while this function was executing
        if (streamRef.current) {
          return;
        }
        // it's important not to await the stream here so that we can cleanup
        // consistently if this hook unmounts during this call
        streamRef.current = networkConversation.streamMessages();
        stream = streamRef.current;

        for await (const message of await stream) {
          await processMessage(
            conversation,
            toCachedMessage(message, client.address),
          );
          onMessage?.(message);
        }
      } catch (e) {
        setError(e as Error);
        onError?.(e as Error);
        void endStream(stream);
        // re-throw error for upstream consumption
        throw e;
      }
    };

    void streamMessages();

    // end streaming on unmount
    return () => {
      void endStream(stream);
    };
  }, [client, conversation, onError, onMessage, processMessage]);

  return {
    error,
  };
};

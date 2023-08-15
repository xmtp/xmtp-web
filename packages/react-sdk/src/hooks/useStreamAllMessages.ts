import type { DecodedMessage } from "@xmtp/xmtp-js";
import { useEffect, useRef, useState } from "react";
import { useClient } from "./useClient";
import type { OnError } from "../sharedTypes";
import { toCachedMessage } from "../helpers/caching/messages";
import { useConversation } from "@/hooks/useConversation";
import { useMessage } from "@/hooks/useMessage";

export type AllMessagesStream = Promise<AsyncGenerator<DecodedMessage>>;

/**
 * This hook streams new messages from all conversations on mount and exposes
 * an error state.
 */
export const useStreamAllMessages = (
  onMessage: (message: DecodedMessage) => void | Promise<void>,
  onError?: OnError["onError"],
) => {
  const [error, setError] = useState<unknown | null>(null);
  const streamRef = useRef<AllMessagesStream | undefined>(undefined);
  const endStreamRef = useRef(async (stream?: AllMessagesStream) => {
    // it's important to reset the stream reference first so that any
    // subsequent mounts can restart the stream
    if (streamRef.current) {
      streamRef.current = undefined;
    }
    if (stream !== undefined) {
      void (await stream).return(undefined);
    }
  });
  const { processMessage } = useMessage();
  const { getCachedByTopic } = useConversation();

  const { client } = useClient();

  // attempt to stream conversation messages on mount
  useEffect(() => {
    // ensure references to the stream and end stream function are available
    // during cleanup
    let stream = streamRef.current;
    const endStream = endStreamRef.current;

    const streamAllMessages = async () => {
      // we can't do anything without a client
      if (client === undefined) {
        const clientError = new Error("XMTP client is not available");
        setError(clientError);
        onError?.(clientError);
        // do not throw the error in this case
        return;
      }

      // don't start a stream if there's already one active
      if (streamRef.current) {
        return;
      }

      try {
        // it's important not to await the stream here so that we can cleanup
        // consistently if this hook unmounts during this call
        streamRef.current = client.conversations.streamAllMessages();
        stream = streamRef.current;

        for await (const message of await stream) {
          const cachedConversation = await getCachedByTopic(
            message.conversation.topic,
          );
          if (cachedConversation) {
            await processMessage(
              cachedConversation,
              toCachedMessage(message, client.address),
            );
          }
          void onMessage(message);
        }
      } catch (e) {
        setError(e);
        onError?.(e);
        void endStream(stream);
        // re-throw error for upstream consumption
        throw e;
      }
    };

    void streamAllMessages();

    // end streaming on unmount
    return () => {
      void endStream(stream);
    };
  }, [onMessage, client, onError, processMessage, getCachedByTopic]);

  return {
    error,
  };
};

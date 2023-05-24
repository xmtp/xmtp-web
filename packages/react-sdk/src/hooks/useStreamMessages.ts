import type { Conversation, DecodedMessage, Stream } from "@xmtp/xmtp-js";
import { useEffect, useRef, useState } from "react";
import type { OnError } from "../sharedTypes";

export type MessageStream = Promise<Stream<DecodedMessage>>;

/**
 * This hook streams new conversation messages on mount and exposes an error state.
 */
export const useStreamMessages = (
  conversation: Conversation,
  onMessage: (message: DecodedMessage) => void,
  onError?: OnError["onError"],
) => {
  const [error, setError] = useState<unknown | null>(null);
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

  // attempt to stream conversation messages on mount
  useEffect(() => {
    // if there's no conversation, don't do anything
    if (!conversation) {
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

      try {
        // it's important not to await the stream here so that we can cleanup
        // consistently if this hook unmounts during this call
        streamRef.current = conversation.streamMessages();
        stream = streamRef.current;

        for await (const message of await stream) {
          onMessage(message);
        }
      } catch (e) {
        setError(e);
        onError?.(e);
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
  }, [conversation, onError, onMessage]);

  return {
    error,
  };
};

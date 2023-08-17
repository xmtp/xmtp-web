import type { Conversation, Stream } from "@xmtp/xmtp-js";
import { useEffect, useRef, useState } from "react";
import { useClient } from "./useClient";
import type { OnError } from "../sharedTypes";
import { useConversation } from "@/hooks/useConversation";
import { toCachedConversation } from "@/helpers/caching/conversations";

export type ConversationStream = Promise<Stream<Conversation>>;

export type UseStreamConversationsOptions = {
  onConversation?: (conversation: Conversation) => void;
  onError?: OnError["onError"];
};

/**
 * This hook listens for new conversations in real-time and calls the passed
 * callback when a new conversation is created. It also exposes an error state.
 */
export const useStreamConversations = (
  options?: UseStreamConversationsOptions,
) => {
  const [error, setError] = useState<Error | null>(null);
  const streamRef = useRef<ConversationStream | undefined>(undefined);
  const endStreamRef = useRef(async (stream?: ConversationStream) => {
    // it's important to reset the stream reference first so that any
    // subsequent mounts can restart the stream
    if (streamRef.current) {
      streamRef.current = undefined;
    }
    if (stream !== undefined) {
      void (await stream).return();
    }
  });

  const { client } = useClient();
  const { saveConversation } = useConversation();

  // destructure options for more granular dependency array
  const { onConversation, onError } = options ?? {};

  /**
   * Attempt to stream conversations on mount
   */
  useEffect(() => {
    // ensure references to the stream and end stream function are available during cleanup
    let stream = streamRef.current;
    const endStream = endStreamRef.current;

    const streamConversations = async () => {
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
        streamRef.current = client.conversations.stream();
        stream = streamRef.current;

        for await (const conversation of await stream) {
          await saveConversation(
            toCachedConversation(conversation, client.address),
          );
          onConversation?.(conversation);
        }
      } catch (e) {
        setError(e as Error);
        onError?.(e as Error);
        void endStream(stream);
        // re-throw error for upstream consumption
        throw e;
      }
    };

    void streamConversations();

    // end streaming on unmount
    return () => {
      void endStream(stream);
    };
  }, [client, saveConversation, onError, onConversation]);

  return {
    error,
  };
};

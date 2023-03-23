import type { Conversation, Stream } from "@xmtp/xmtp-js";
import { useContext, useEffect, useRef, useState } from "react";
import { XMTPContext } from "../contexts/XMTPContext";

type ConversationStream = Promise<Stream<Conversation>>;

/**
 * This hook streams new conversations on mount and exposes an error state.
 */
export const useStreamConversations = () => {
  const [error, setError] = useState<unknown | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
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

  const xmtpContext = useContext(XMTPContext);
  if (xmtpContext === undefined) {
    console.error("useStreamConversations must be used within a XMTPProvider");
  }

  /**
   * Attempt to stream conversations on mount
   */
  useEffect(() => {
    // ensure references to the stream and end stream function are available during cleanup
    let stream = streamRef.current;
    const endStream = endStreamRef.current;

    const streamConversations = async () => {
      // we can't do anything without a client
      if (xmtpContext?.client === undefined) {
        console.error("XMTP client is not available");
        return;
      }

      // don't start a stream if there's already one active
      if (streamRef.current) {
        return;
      }

      try {
        // it's important not to await the stream here so that we can cleanup
        // consistently if this hook unmounts during this call
        streamRef.current = xmtpContext.client.conversations.stream();
        stream = streamRef.current;

        // eslint-disable-next-line no-restricted-syntax
        for await (const conversation of await stream) {
          setConversations((previous) => [...previous, conversation]);
        }
      } catch (e) {
        setError(e);
        void endStream(stream);
      }
    };

    void streamConversations();

    // end streaming on unmount
    return () => {
      void endStream(stream);
    };
  }, [xmtpContext?.client]);

  return {
    conversations,
    error,
  };
};

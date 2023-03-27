import type { DecodedMessage } from "@xmtp/xmtp-js";
import { useContext, useEffect, useRef, useState } from "react";
import { XMTPContext } from "../contexts/XMTPContext";

export type AllMessagesStream = Promise<AsyncGenerator<DecodedMessage>>;

/**
 * This hook streams new messages from all conversations on mount and exposes
 * an error state.
 */
export const useStreamAllMessages = () => {
  const [error, setError] = useState<unknown | null>(null);
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
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

  const xmtpContext = useContext(XMTPContext);
  if (xmtpContext === undefined) {
    console.error("useStreamAllMessages must be used within a XMTPProvider");
  }

  // attempt to stream conversation messages on mount
  useEffect(() => {
    // ensure references to the stream and end stream function are available
    // during cleanup
    let stream = streamRef.current;
    const endStream = endStreamRef.current;

    const streamAllMessages = async () => {
      // we can't do anything without a client
      if (xmtpContext?.client === undefined) {
        console.error("XMTP client is not initialized");
        return;
      }

      // don't start a stream if there's already one active
      if (streamRef.current) {
        return;
      }

      try {
        // it's important not to await the stream here so that we can cleanup
        // consistently if this hook unmounts during this call
        streamRef.current =
          xmtpContext.client.conversations.streamAllMessages();
        stream = streamRef.current;

        for await (const message of await stream) {
          setMessages((previous) => [...previous, message]);
        }
      } catch (e) {
        setError(e);
        void endStream(stream);
      }
    };

    void streamAllMessages();

    // end streaming on unmount
    return () => {
      void endStream(stream);
    };
  }, [xmtpContext?.client]);

  return {
    error,
    messages,
  };
};

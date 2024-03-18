import type { PrivatePreferencesAction, Stream } from "@xmtp/xmtp-js";
import { useEffect, useRef, useState } from "react";
import { useClient } from "./useClient";
import type { OnError } from "../sharedTypes";
import { useConsent } from "@/hooks/useConsent";

export type ConsentListStream = Promise<
  Stream<PrivatePreferencesAction, string>
>;

/**
 * This hook streams new consent list actions on mount and exposes
 * an error state.
 */
export const useStreamConsentList = (
  onAction?: (action: PrivatePreferencesAction) => void | Promise<void>,
  onError?: OnError["onError"],
) => {
  const { allow, deny } = useConsent();
  const [error, setError] = useState<Error | null>(null);
  const streamRef = useRef<ConsentListStream | undefined>(undefined);
  const endStreamRef = useRef(async (stream?: ConsentListStream) => {
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

  // attempt to stream consent list actions on mount
  useEffect(() => {
    // ensure references to the stream and end stream function are available
    // during cleanup
    let stream = streamRef.current;
    const endStream = endStreamRef.current;

    const streamConsentList = async () => {
      // don't start a stream if there's already one active
      if (streamRef.current) {
        return;
      }

      // we can't do anything without a client
      if (client === undefined) {
        const clientError = new Error("XMTP client is not available");
        setError(clientError);
        onError?.(clientError);
        // do not throw the error in this case
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
        streamRef.current = client.contacts.streamConsentList();
        stream = streamRef.current;

        for await (const action of await stream) {
          // update the local DB, but don't publish to the network
          if (action.allowAddress) {
            void allow(action.allowAddress.walletAddresses, true);
          }
          if (action.denyAddress) {
            void deny(action.denyAddress.walletAddresses, true);
          }
          void onAction?.(action);
        }
      } catch (e) {
        setError(e as Error);
        onError?.(e as Error);
        void endStream(stream);
        // re-throw error for upstream consumption
        throw e;
      }
    };

    void streamConsentList();

    // end streaming on unmount
    return () => {
      void endStream(stream);
    };
  }, [client, onError, onAction, allow, deny]);

  return {
    error,
  };
};

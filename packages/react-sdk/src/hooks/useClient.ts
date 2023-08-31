import { useCallback, useContext, useRef, useState } from "react";
import type { ClientOptions, Signer } from "@xmtp/xmtp-js";
import { Client } from "@xmtp/xmtp-js";
import { XMTPContext } from "../contexts/XMTPContext";
import type { OnError } from "@/sharedTypes";
import { processUnprocessedMessages } from "@/helpers/caching/messages";

export type InitializeClientOptions = {
  /**
   * Provide a XMTP PrivateKeyBundle encoded as a Uint8Array for signing
   *
   * This is required if `signer` is not specified
   */
  keys?: Uint8Array;
  /**
   * XMTP client options
   */
  options?: Partial<Omit<ClientOptions, "codecs">>;
  /**
   * The signer (wallet) to associate with the XMTP client
   */
  signer?: Signer | null;
};

/**
 * This hook allows you to initialize, disconnect, and access the XMTP client
 * instance. It also exposes the error and loading states of the client.
 */
export const useClient = (onError?: OnError["onError"]) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // client is initializing
  const initializingRef = useRef(false);

  const {
    client,
    setClient,
    setClientSigner,
    signer: clientSigner,
    codecs,
    db,
    processors,
    namespaces,
    validators,
  } = useContext(XMTPContext);

  /**
   * Initialize an XMTP client
   */
  const initialize = useCallback(
    async ({ keys, options, signer }: InitializeClientOptions) => {
      // only initialize a client if one doesn't already exist
      if (!client && signer) {
        // if the client is already initializing, don't do anything
        if (initializingRef.current) {
          return undefined;
        }

        // flag the client as initializing
        initializingRef.current = true;

        // reset error state
        setError(null);
        // reset loading state
        setIsLoading(true);

        let xmtpClient: Client;

        try {
          // create a new XMTP client with the provided keys, or a wallet
          xmtpClient = await Client.create(keys ? null : signer, {
            ...options,
            codecs,
            privateKeyOverride: keys,
          });
          setClient(xmtpClient);
          setClientSigner(signer);
        } catch (e) {
          setClient(undefined);
          setClientSigner(undefined);
          setError(e as Error);
          onError?.(e as Error);
          // re-throw error for upstream consumption
          throw e;
        }

        setIsLoading(false);

        // process unprocessed messages
        try {
          await processUnprocessedMessages({
            client: xmtpClient,
            db,
            processors,
            namespaces,
            validators,
          });
        } catch (e) {
          onError?.(e as Error);
        } finally {
          initializingRef.current = false;
        }

        return xmtpClient;
      }
      return client;
    },
    [
      client,
      codecs,
      db,
      namespaces,
      onError,
      processors,
      setClient,
      setClientSigner,
      validators,
    ],
  );

  /**
   * Disconnect the XMTP client
   */
  const disconnect = useCallback(async () => {
    if (client) {
      await client.close();
      setClient(undefined);
      setClientSigner(undefined);
    }
  }, [client, setClient, setClientSigner]);

  return {
    client,
    disconnect,
    error,
    initialize,
    isLoading,
    signer: clientSigner,
  };
};

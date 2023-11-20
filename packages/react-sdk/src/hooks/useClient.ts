import { useCallback, useContext, useRef, useState } from "react";
import type { ClientOptions, Signer } from "@xmtp/xmtp-js";
import { Client } from "@xmtp/xmtp-js";
import type { WalletClient } from "viem";
import { XMTPContext } from "../contexts/XMTPContext";
import type { OnError } from "@/sharedTypes";
import { processUnprocessedMessages } from "@/helpers/caching/messages";
import { loadConsentListFromCache } from "@/helpers/caching/consent";

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
  signer?: Signer | WalletClient | null;
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

  const { client, setClient, codecs, db, processors, namespaces, validators } =
    useContext(XMTPContext);

  /**
   * Initialize an XMTP client
   */
  const initialize = useCallback(
    async ({ keys, options, signer }: InitializeClientOptions) => {
      // only initialize a client if one doesn't already exist
      if (!client && (signer || keys)) {
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
          xmtpClient = await Client.create(signer ?? null, {
            ...options,
            codecs,
            privateKeyOverride: keys,
          });
          setClient(xmtpClient);
        } catch (e) {
          setClient(undefined);
          setError(e as Error);
          onError?.(e as Error);
          // re-throw error for upstream consumption
          throw e;
        } finally {
          initializingRef.current = false;
        }

        setIsLoading(false);

        // load cached consent list
        try {
          await loadConsentListFromCache(xmtpClient, db);
        } catch (e) {
          onError?.(e as Error);
        }

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
        }

        initializingRef.current = false;

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
    }
  }, [client, setClient]);

  return {
    client,
    disconnect,
    error,
    initialize,
    isLoading,
  };
};

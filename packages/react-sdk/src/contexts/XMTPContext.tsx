import { useState, createContext, useCallback, useMemo, useRef } from "react";
import type { ClientOptions, Signer } from "@xmtp/xmtp-js";
import { Client } from "@xmtp/xmtp-js";
import type { OnError } from "../sharedTypes";

type CanMessageReturns<T> = T extends string
  ? boolean
  : T extends string[]
  ? boolean[]
  : never;

export type InitClientArgs = {
  keys?: Uint8Array;
  options?: Partial<ClientOptions> & OnError;
  signer?: Signer | null;
};

export type XMTPContextValue = {
  /**
   * XMTP client error
   */
  error: unknown;
  /**
   * Check if a wallet address is on the XMTP network
   */
  canMessage: <T extends string | string[]>(
    peerAddress: T,
  ) => Promise<CanMessageReturns<T>>;
  /**
   * XMTP JS Client
   */
  client?: Client;
  /**
   * Disconnect the XMTP client
   */
  closeClient: () => void;
  /**
   * Initialize the XMTP client
   */
  initClient: (arg0: InitClientArgs) => Promise<Client | undefined>;
  /**
   * Loading state when the XMTP client is busy
   */
  isLoading: boolean;
  /**
   * The signer (wallet) associated with the XMTP client
   */
  signer?: Signer;
};

export const XMTPContext = createContext<XMTPContextValue>({
  canMessage: () => Promise.resolve(false) as Promise<CanMessageReturns<false>>,
  client: undefined,
  closeClient: () => {},
  error: null,
  initClient: () => Promise.resolve(undefined),
  isLoading: false,
});

export const XMTPProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [clientSigner, setClientSigner] = useState<Signer | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const initializingRef = useRef(false);

  // initialize the XMTP client
  const initClient = useCallback(
    async ({ keys, options, signer }: InitClientArgs) => {
      // client already exists, don't re-initialize
      if (!client && signer) {
        // if the client is already initializing, don't do anything
        if (initializingRef.current) {
          return undefined;
        }

        // flag the client as initializing
        initializingRef.current = true;

        setError(null);
        setIsLoading(true);

        try {
          // create a new XMTP client with the provided keys, or a wallet
          const xmtpClient = await Client.create(keys ? null : signer, {
            ...options,
            privateKeyOverride: keys,
          });
          setClient(xmtpClient);
          setClientSigner(signer);
          return xmtpClient;
        } catch (e) {
          setClient(undefined);
          setClientSigner(undefined);
          setError(e);
          options?.onError?.(e);
          // re-throw error for upstream consumption
          throw e;
        } finally {
          setIsLoading(false);
          initializingRef.current = false;
        }
      }
      return client;
    },
    [client],
  );

  // close the XMTP client
  const closeClient = useCallback(async () => {
    if (client) {
      await client.close();
      setClient(undefined);
      setClientSigner(undefined);
    }
  }, [client]);

  // check if the client can message an address
  const canMessage = useCallback(
    async <T extends string | string[]>(
      peerAddress: T,
    ): Promise<CanMessageReturns<T>> => {
      if (!client) {
        return typeof peerAddress === "string"
          ? (false as CanMessageReturns<T>)
          : (Array.from({ length: peerAddress.length }).fill(
              false,
            ) as CanMessageReturns<T>);
      }
      return typeof peerAddress === "string"
        ? (client.canMessage(peerAddress) as Promise<CanMessageReturns<T>>)
        : (client.canMessage(peerAddress) as Promise<CanMessageReturns<T>>);
    },
    [client],
  );

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      canMessage,
      client,
      closeClient,
      error,
      initClient,
      isLoading,
      signer: clientSigner,
    }),
    [
      canMessage,
      client,
      clientSigner,
      closeClient,
      error,
      initClient,
      isLoading,
    ],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

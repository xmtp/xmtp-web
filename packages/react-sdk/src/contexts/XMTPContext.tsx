import { useState, createContext, useCallback, useMemo, useRef } from "react";
import type { ClientOptions, Signer } from "@xmtp/xmtp-js";
import { Client } from "@xmtp/xmtp-js";

type CanMessageReturns<T> = T extends string
  ? boolean
  : T extends string[]
  ? boolean[]
  : never;

export type InitClientArgs = {
  keys?: Uint8Array;
  options?: ClientOptions;
  signer?: Signer | null;
};

export type XMTPContextValue = {
  error: unknown;
  canMessage: <T extends string | string[]>(
    peerAddress: T,
  ) => Promise<CanMessageReturns<T>>;
  client?: Client;
  closeClient: () => void;
  initClient: (arg0: InitClientArgs) => Promise<Client | undefined>;
  isLoading: boolean;
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
          return xmtpClient;
        } catch (e) {
          setClient(undefined);
          setError(e);
          // re-throw error so that consumers can process
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
    }),
    [canMessage, client, closeClient, error, initClient, isLoading],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

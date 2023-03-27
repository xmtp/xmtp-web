import { useState, createContext, useCallback, useMemo, useRef } from "react";
import type { ClientOptions, Signer } from "@xmtp/xmtp-js";
import { Client } from "@xmtp/xmtp-js";

export type InitClientArgs = {
  keys?: Uint8Array;
  options?: ClientOptions;
  signer?: Signer | null;
};

// check if the client can message an address or addresses
async function canMessage(
  peerAddress: string,
  client?: Client,
): Promise<boolean>;
async function canMessage(
  peerAddress: string[],
  client?: Client,
): Promise<boolean[]>;
async function canMessage(
  peerAddress: string | string[],
  client?: Client,
): Promise<boolean | boolean[]> {
  if (!client) {
    return typeof peerAddress === "string"
      ? false
      : (new Array(peerAddress.length).fill(false) as boolean[]);
  }
  return typeof peerAddress === "string"
    ? client.canMessage(peerAddress)
    : client.canMessage(peerAddress);
}

export type XMTPContextValue = {
  error: unknown;
  canMessage: typeof canMessage;
  client?: Client;
  closeClient: () => void;
  initClient: (arg0: InitClientArgs) => Promise<void>;
  isLoading: boolean;
};

export const XMTPContext = createContext<XMTPContextValue>({
  canMessage,
  client: undefined,
  closeClient: () => {},
  error: null,
  initClient: () => Promise.resolve(),
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
          return;
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
    [client, closeClient, error, initClient, isLoading],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

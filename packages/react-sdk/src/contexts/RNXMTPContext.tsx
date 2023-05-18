import type React from "react";
import type { ReactElement } from "react";
import { useState, createContext, useCallback, useMemo } from "react";
import type { Signer as EthersSigner } from "ethers";
import { useSigner } from "@thirdweb-dev/react-native";

type CanMessageReturns<T> = T extends string
  ? boolean
  : T extends string[]
  ? boolean[]
  : never;

export type InitClientArgs = {
  signer?: EthersSigner | null;
};

export type Conversations = {
  client: RNClient;
};

export type RNClient = {
  canMessage(peerAddress: string): Promise<CanMessageReturns<T>>;
  address: string;
  conversations: Conversations;
  create: (signer: EthersSigner, environment: string) => Promise<RNClient>;
  close: () => Promise<boolean>;
};

export type RNXMTPProviderProps = {
  rnClient: RNClient;
  children: ReactElement;
};

export type RNXMTPContextValue = {
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
  client?: RNClient;
  /**
   * Disconnect the XMTP client
   */
  closeClient: () => void;
  /**
   * Initialize the React Native XMTP client
   */
  initRNClient: (arg0: InitClientArgs) => Promise<RNClient | undefined>;
  /**
   * Loading state when the XMTP client is busy
   */
  isLoading: boolean;
  /**
   * The signer (wallet) associated with the XMTP client
   */
  signer?: EthersSigner;
};

export const RNXMTPContext = createContext<RNXMTPContextValue>({
  canMessage: () => Promise.resolve(false) as Promise<CanMessageReturns<false>>,
  client: undefined,
  closeClient: () => {},
  error: null,
  initRNClient: () => Promise.resolve(undefined),
  isLoading: false,
});

export const RNXMTPProvider: React.FC<RNXMTPProviderProps> = ({
  rnClient,
  children,
}) => {
  const [client, setClient] = useState<RNClient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const thirdWebSigner = useSigner();

  const initClient = useCallback(async () => {
    if (thirdWebSigner && rnClient) {
      setIsLoading(true);
      try {
        // Fix typescript issue
        const xmtpClient = await rnClient.create(thirdWebSigner, "dev");
        setClient(xmtpClient);

        setIsLoading(false);
      } catch (e) {
        setError(true);
      }
      setIsLoading(false);
    }
    return client;
  }, [thirdWebSigner, rnClient, client]);

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
      // To-do: Implement canMessage
      // return typeof peerAddress === "string"
      //   ? (client.canMessage(peerAddress) as Promise<CanMessageReturns<T>>)
      //   : (client.canMessage(peerAddress) as Promise<CanMessageReturns<T>>);
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

  return (
    <RNXMTPContext.Provider value={value}>{children}</RNXMTPContext.Provider>
  );
};

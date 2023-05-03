import "@rainbow-me/rainbowkit/styles.css";
import type { Signer } from "@xmtp/react-sdk";
import { createContext, useMemo } from "react";
import { useAccount, useConnect, useDisconnect, useSigner } from "wagmi";

export type WalletContextValue = {
  address: `0x${string}` | undefined;
  disconnect: ReturnType<typeof useDisconnect>["disconnect"];
  error: Error | null;
  isConnected: boolean;
  isLoading: boolean;
  signer: Signer | undefined | null;
};

export const WalletContext = createContext<WalletContextValue>({
  address: undefined,
  disconnect: () => {},
  error: null,
  isConnected: false,
  isLoading: false,
  signer: undefined,
});

export const WalletProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { error } = useConnect();
  const { data: signer } = useSigner();
  const { disconnect } = useDisconnect();

  const isLoading = isConnecting || isReconnecting;

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ address, disconnect, error, isLoading, signer, isConnected }),
    [address, disconnect, error, isLoading, signer, isConnected],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

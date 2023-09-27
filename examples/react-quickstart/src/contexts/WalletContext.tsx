import "@rainbow-me/rainbowkit/styles.css";
import { createContext, useMemo } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export type WalletContextValue = {
  address: `0x${string}` | undefined;
  disconnect: ReturnType<typeof useDisconnect>["disconnect"];
  error: Error | null;
  isConnected: boolean;
  isLoading: boolean;
};

export const WalletContext = createContext<WalletContextValue>({
  address: undefined,
  disconnect: () => {},
  error: null,
  isConnected: false,
  isLoading: false,
});

export const WalletProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { error } = useConnect();
  const { disconnect } = useDisconnect();

  const isLoading = isConnecting || isReconnecting;

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      address,
      disconnect,
      error,
      isLoading,
      isConnected,
    }),
    [address, disconnect, error, isLoading, isConnected],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

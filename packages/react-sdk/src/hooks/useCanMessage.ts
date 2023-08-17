import { useCallback, useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import type { CanMessageReturns, OnError } from "../sharedTypes";
import { useClient } from "@/hooks/useClient";

/**
 * This hook exposes both the client and static instances of the `canMessage`
 * method.
 */
export const useCanMessage = (onError?: OnError["onError"]) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useClient();

  /**
   * Check if one or more wallet addresses is on the XMTP network using the
   */
  const canMessage = useCallback(
    async <T extends string | string[]>(
      peerAddress: T,
    ): Promise<CanMessageReturns<T>> => {
      if (!client) {
        throw new Error(
          "XMTP client is required to check if an address is on the network",
        );
      }

      setIsLoading(false);
      setError(null);

      try {
        // this weirdness is required to get proper typing
        return typeof peerAddress === "string"
          ? await (client.canMessage(peerAddress) as Promise<
              CanMessageReturns<T>
            >)
          : await (client.canMessage(peerAddress) as Promise<
              CanMessageReturns<T>
            >);
      } catch (e) {
        setError(e as Error);
        onError?.(e as Error);
        // re-throw error for upstream consumption
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [client, onError],
  );

  /**
   * Check if a wallet address is on the XMTP network without a client instance
   */
  const canMessageStatic = useCallback(
    async <T extends string | string[]>(
      peerAddress: T,
      options?: Parameters<typeof Client.canMessage>["1"],
    ): Promise<CanMessageReturns<T>> => {
      setIsLoading(false);
      setError(null);

      try {
        return typeof peerAddress === "string"
          ? await (Client.canMessage(peerAddress, options) as Promise<
              CanMessageReturns<T>
            >)
          : await (Client.canMessage(peerAddress, options) as Promise<
              CanMessageReturns<T>
            >);
      } catch (e) {
        setError(e as Error);
        onError?.(e as Error);
        // re-throw error for upstream consumption
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [onError],
  );

  return {
    error,
    isLoading,
    canMessage,
    canMessageStatic,
  };
};

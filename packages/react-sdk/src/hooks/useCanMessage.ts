import { useCallback, useContext, useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import { XMTPContext } from "../contexts/XMTPContext";
import type { CanMessageReturns, OnError } from "../sharedTypes";

/**
 * This hook exposes both the client and static instances of the `canMessage`
 * method.
 */
export const useCanMessage = (onError?: OnError["onError"]) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const xmtpContext = useContext(XMTPContext);

  const { canMessage: cm } = xmtpContext;

  /**
   * Check if a wallet address is on the XMTP network using the client instance
   */
  const canMessage = useCallback<typeof cm>(
    async (peerAddress) => {
      setIsLoading(false);
      setError(null);

      try {
        return await cm(peerAddress);
      } catch (e) {
        setError(e);
        onError?.(e);
        // re-throw error for upstream consumption
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [cm, onError],
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
        setError(e);
        onError?.(e);
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

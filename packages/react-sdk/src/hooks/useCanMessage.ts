import { useCallback, useContext, useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import { XMTPContext } from "../contexts/XMTPContext";
import type { OnError } from "../sharedTypes";

/**
 * This hook exposes both the client and static instances of the `canMessage`
 * method.
 */
export const useCanMessage = (onError?: OnError["onError"]) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const xmtpContext = useContext(XMTPContext);

  if (xmtpContext === undefined) {
    console.error("This hook must be used within the context of XMTPProvider");
  }

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
    async (...args: Parameters<typeof Client.canMessage>) => {
      setIsLoading(false);
      setError(null);

      try {
        return await Client.canMessage(...args);
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

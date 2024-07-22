import { useCallback, useState } from "react";
import { useMessage } from "@/hooks/useMessage";
import type { UseSendMessageOptions } from "@/hooks/useSendMessage";
import type { CachedMessage } from "@/helpers/caching/messages";

/**
 * This hook can be used to resend a previously failed message, or cancel it.
 */
export const useResendMessage = (options?: UseSendMessageOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { resendMessage, deleteMessage } = useMessage();

  // destructure options for more granular dependency array
  const { onError, onSuccess } = options ?? {};

  const resend = useCallback(
    async (message: CachedMessage) => {
      setIsLoading(true);
      setError(null);

      try {
        const sentMessage = await resendMessage(message);
        onSuccess?.(sentMessage);
        return sentMessage;
      } catch (e) {
        setError(e as Error);
        onError?.(e as Error);
        // re-throw error for upstream consumption
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [resendMessage, onError, onSuccess],
  );

  const cancel = useCallback(
    async (message: CachedMessage) => {
      try {
        await deleteMessage(message);
      } catch (e) {
        setError(e as Error);
        onError?.(e as Error);
        // re-throw error for upstream consumption
        throw e;
      }
    },
    [deleteMessage, onError],
  );

  return {
    cancel,
    error,
    isLoading,
    resend,
  };
};

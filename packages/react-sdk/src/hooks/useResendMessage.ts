import { useCallback, useState } from "react";
import { useMessage } from "@/hooks/useMessage";
import type { UseSendMessageOptions } from "@/hooks/useSendMessage";
import type { CachedMessageWithId } from "@/helpers/caching/messages";

/**
 * This hook resends a cached message that previously failed to send.
 */
export const useResendMessage = (options?: UseSendMessageOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { resendMessage: _resendMessage } = useMessage();

  // destructure options for more granular dependency array
  const { onError, onSuccess } = options ?? {};

  const resendMessage = useCallback(
    async (message: CachedMessageWithId) => {
      setIsLoading(true);
      setError(null);

      try {
        const sentMessage = await _resendMessage(message);
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
    [_resendMessage, onError, onSuccess],
  );

  return {
    error,
    isLoading,
    resendMessage,
  };
};

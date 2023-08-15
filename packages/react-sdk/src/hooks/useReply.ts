import { useEffect, useState } from "react";
import { useDb } from "./useDb";
import type { CachedMessage } from "@/helpers/caching/messages";
import { getOriginalMessageFromReply } from "@/helpers/caching/contentTypes/reply";

/**
 * This hook returns the original message of a cached reply
 */
export const useReply = (message?: CachedMessage) => {
  const { db } = useDb();

  const [originalMessage, setOriginalMessage] = useState<
    CachedMessage | undefined
  >(undefined);

  useEffect(() => {
    const getOriginalMessage = async () => {
      if (message) {
        const msg = await getOriginalMessageFromReply(message, db);
        if (msg) {
          setOriginalMessage(msg);
        }
      }
    };
    void getOriginalMessage();
  }, [db, message]);

  return { originalMessage };
};

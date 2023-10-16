import { useLiveQuery } from "dexie-react-hooks";
import { useDb } from "./useDb";
import type { CachedMessage } from "@/helpers/caching/messages";
import { getReplies } from "@/helpers/caching/contentTypes/reply";

/**
 * This hook returns cached replies to a message from the local cache
 */
export const useReplies = (message?: CachedMessage) => {
  const { db } = useDb();

  return (
    useLiveQuery(async () => {
      if (!message) return [];
      try {
        return await getReplies(message, db);
      } catch {
        return [];
      }
    }, [message]) ?? []
  );
};

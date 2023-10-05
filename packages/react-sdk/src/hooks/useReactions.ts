import { useLiveQuery } from "dexie-react-hooks";
import { useDb } from "./useDb";
import type { CachedMessage } from "@/helpers/caching/messages";
import type { CachedReactionsTable } from "@/helpers/caching/contentTypes/reaction";

/**
 * This hook returns cached reactions to a message from the local cache
 */
export const useReactions = (message?: CachedMessage) => {
  const { db } = useDb();

  return (
    useLiveQuery(async () => {
      if (!message) return [];
      try {
        const reactionsTable = db.table("reactions") as CachedReactionsTable;
        return await reactionsTable
          .where("referenceXmtpID")
          .equals(message.xmtpID)
          .sortBy("sentAt");
      } catch {
        return [];
      }
    }, [message]) ?? []
  );
};

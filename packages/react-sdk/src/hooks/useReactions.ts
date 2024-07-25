import { useLiveQuery } from "dexie-react-hooks";
import { useDb } from "./useDb";
import type { CachedMessage } from "@/helpers/caching/messages";
import type { CachedReactionsTable } from "@/helpers/caching/contentTypes/reaction";

/**
 * This hook returns cached reactions to a message from the local cache
 */
export const useReactions = (message?: CachedMessage) => {
  const { getDbInstance } = useDb();

  return (
    useLiveQuery(async () => {
      if (!message) return [];
      try {
        const db = await getDbInstance();
        const reactionsTable = db.table("reactions") as CachedReactionsTable;
        return await reactionsTable
          .where("referenceXmtpID")
          .equals(message.id)
          .sortBy("sentAt");
      } catch {
        return [];
      }
    }, [message, getDbInstance]) ?? []
  );
};

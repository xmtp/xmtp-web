import { useLiveQuery } from "dexie-react-hooks";
import { useDb } from "./useDb";
import type { CachedConversationsTable } from "@/helpers/caching/conversations";
import { useClient } from "@/hooks/useClient";

/**
 * This hook returns cached conversations from the local cache based on the
 * current client's address
 *
 * It's intended to be used internally and is not exported from the SDK
 */
export const useCachedConversations = () => {
  const { db } = useDb();
  const { client } = useClient();
  return (
    useLiveQuery(async () => {
      // client required for address
      if (!client) {
        return [];
      }
      return (db.table("conversations") as CachedConversationsTable)
        .where("walletAddress")
        .equals(client.address)
        .reverse()
        .sortBy("updatedAt");
    }, [client?.address]) ?? []
  );
};

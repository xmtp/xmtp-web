import { useLiveQuery } from "dexie-react-hooks";
import { useDb } from "./useDb";
import type { CachedMessagesTable } from "@/helpers/caching/messages";
import { useClient } from "@/hooks/useClient";

/**
 * This hook returns cached conversations from the local cache based on the
 * current client's address
 *
 * It's intended to be used internally and is not exported from the SDK
 */
export const useCachedMessages = (topic: string) => {
  const { db } = useDb();
  const { client } = useClient();
  return (
    useLiveQuery(async () => {
      // client required for address
      if (!client) {
        return [];
      }
      return (db.table("messages") as CachedMessagesTable)
        .where({
          conversationTopic: topic,
          walletAddress: client.address,
        })
        .sortBy("sentAt");
    }, [topic]) ?? []
  );
};

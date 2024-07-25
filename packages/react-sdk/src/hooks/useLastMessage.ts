import { useLiveQuery } from "dexie-react-hooks";
import { useDb } from "./useDb";
import type { CachedMessagesTable } from "@/helpers/caching/messages";

/**
 * This hook returns the last message from a conversation from the local cache
 */
export const useLastMessage = (topic: string) => {
  const { getDbInstance } = useDb();

  return useLiveQuery(async () => {
    const db = await getDbInstance();
    const messagesTable = db.table("messages") as CachedMessagesTable;
    const messages = await messagesTable
      .where({
        conversationTopic: topic,
      })
      .reverse()
      .sortBy("sentAt");
    return messages.filter((message) => message.content !== undefined)[0];
  }, [topic]);
};

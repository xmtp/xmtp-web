import { useLiveQuery } from "dexie-react-hooks";
import { useDb } from "./useDb";
import { useClient } from "@/hooks/useClient";
import { getCachedConsentEntriesMap } from "@/helpers/caching/consent";

/**
 * This hook returns cached consent entries from the local cache based on the
 * current client's address
 *
 * It's intended to be used internally and is not exported from the SDK
 */
export const useCachedConsentEntries = () => {
  const { getDbInstance } = useDb();
  const { client } = useClient();
  return (
    useLiveQuery(async () => {
      // client required
      if (!client) {
        return {};
      }
      const db = await getDbInstance();
      return getCachedConsentEntriesMap(client.address, db);
    }, [client?.address]) ?? {}
  );
};

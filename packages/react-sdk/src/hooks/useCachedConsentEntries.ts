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
  const { db } = useDb();
  const { client } = useClient();
  return (
    useLiveQuery(async () => {
      // client required for address
      if (!client) {
        return {};
      }
      return getCachedConsentEntriesMap(client.address, db);
    }, [client?.address]) ?? {}
  );
};

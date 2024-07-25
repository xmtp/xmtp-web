import { useCallback, useContext } from "react";
import { XMTPContext } from "@/contexts/XMTPContext";
import { clearCache as _clearCache, getDbInstance } from "@/helpers/caching/db";

/**
 * This hook returns the local DB instance and a method for clearing all of
 * its data
 */
export const useDb = () => {
  const xmtpContext = useContext(XMTPContext);
  const { contentTypeConfigs, dbRef } = xmtpContext;

  const getInstance = useCallback(async () => {
    if (!dbRef.current) {
      dbRef.current = await getDbInstance({ contentTypeConfigs });
    }
    return dbRef.current;
  }, [contentTypeConfigs, dbRef]);

  /**
   * Clear all data in the local cache
   */
  const clearCache = useCallback(async () => {
    const db = await getInstance();
    // clear all data
    await _clearCache(db);
  }, [getInstance]);

  return { clearCache, getInstance };
};

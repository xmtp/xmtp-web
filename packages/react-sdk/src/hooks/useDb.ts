import { useCallback, useContext } from "react";
import { XMTPContext } from "@/contexts/XMTPContext";
import { clearCache as _clearCache } from "@/helpers/caching/db";

/**
 * This hook returns the local DB instance and a method for clearing all of
 * its data
 */
export const useDb = () => {
  const xmtpContext = useContext(XMTPContext);
  const { db } = xmtpContext;

  /**
   * Clear all data in the local cache
   */
  const clearCache = useCallback(async () => {
    // clear all data
    await _clearCache(db);
  }, [db]);

  return { clearCache, db };
};

/* c8 ignore start */
import { useContext } from "react";
import { XMTPContext } from "@/contexts/XMTPContext";

/**
 * This hook returns the local DB instance and a method for clearing all of
 * its data
 */
export const useDb = () => {
  const xmtpContext = useContext(XMTPContext);
  const { clearCache, db } = xmtpContext;
  return { clearCache, db };
};
/* c8 ignore stop */

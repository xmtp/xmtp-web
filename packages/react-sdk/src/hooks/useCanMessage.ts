import { useContext } from "react";
import { Client } from "@xmtp/xmtp-js";
import { XMTPContext } from "../contexts/XMTPContext";

/**
 * This hook exposes both the client and static instances of the `canMessage`
 * method.
 */
export const useCanMessage = () => {
  const xmtpContext = useContext(XMTPContext);

  return {
    canMessage: xmtpContext.canMessage,
    /**
     * Check if a wallet address is on the XMTP network without a client instance
     */
    canMessageStatic: Client.canMessage,
  };
};

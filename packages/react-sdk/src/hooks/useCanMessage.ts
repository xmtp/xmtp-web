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
    canMessageStatic: Client.canMessage,
  };
};

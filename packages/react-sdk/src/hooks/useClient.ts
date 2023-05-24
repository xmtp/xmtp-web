import { useContext } from "react";
import { XMTPContext } from "../contexts/XMTPContext";

/**
 * This hook allows you to initialize, disconnect, and access the XMTP client
 * instance. It also exposes the error and loading states of the client.
 */
export const useClient = () => {
  const xmtpContext = useContext(XMTPContext);
  if (xmtpContext === undefined) {
    console.error("This hook must be used within the context of XMTPProvider");
  }

  return {
    client: xmtpContext.client,
    disconnect: xmtpContext.closeClient,
    error: xmtpContext.error,
    initialize: xmtpContext.initClient,
    isLoading: xmtpContext.isLoading,
    signer: xmtpContext.signer,
  };
};

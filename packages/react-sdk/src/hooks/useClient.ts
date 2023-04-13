import { useContext } from "react";
import type { InitClientArgs } from "../contexts/XMTPContext";
import { XMTPContext } from "../contexts/XMTPContext";

/**
 * This hook allows you to initialize, disconnect, and access the XMTP client
 * instance. It also exposes the error and loading states of the client.
 */
export const useClient = () => {
  const xmtpContext = useContext(XMTPContext);
  if (xmtpContext === undefined) {
    console.error("useClient must be used within a XMTPProvider");
  }

  return {
    client: xmtpContext.client,
    disconnect: xmtpContext.closeClient,
    error: xmtpContext.error,
    initialize: ({ keys, options, signer }: InitClientArgs) =>
      xmtpContext.initClient({ keys, options, signer }),
    isLoading: xmtpContext.isLoading,
  };
};

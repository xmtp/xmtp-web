import { useContext, useEffect } from "react";
import type { InitClientArgs } from "../contexts/XMTPContext";
import { XMTPContext } from "../contexts/XMTPContext";

/**
 * This hook allows you to initialize, disconnect, and access the XMTP client
 * instance. It also exposes the error and loading states of the client.
 */
export const useClient = ({ keys, options, signer }: InitClientArgs) => {
  const xmtpContext = useContext(XMTPContext);
  if (xmtpContext === undefined) {
    console.error("useClient must be used within a XMTPProvider");
  }

  // disconnect XMTP client when the wallet changes
  useEffect(() => {
    xmtpContext.closeClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer]);

  return {
    client: xmtpContext?.client,
    disconnect: xmtpContext.closeClient,
    error: xmtpContext.error,
    initialize: () => xmtpContext?.initClient({ keys, options, signer }),
    isLoading: xmtpContext.isLoading,
  };
};

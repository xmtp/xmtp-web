import { useContext, useEffect } from "react";
import type { Signer } from "@xmtp/xmtp-js";
import { Client } from "@xmtp/xmtp-js";
import type { InitClientArgs } from "../contexts/XMTPContext";
import { XMTPContext } from "../contexts/XMTPContext";

/**
 * This hook allows you to initialize, disconnect, and access the XMTP client
 * instance. It also exposes the error and loading states of the client.
 */
export const useClient = ({
  options,
  signer,
}: Pick<InitClientArgs, "options" | "signer">) => {
  const xmtpContext = useContext(XMTPContext);
  if (xmtpContext === undefined) {
    console.error("useClient must be used within a XMTPProvider");
  }

  // disconnect XMTP client when the wallet changes
  useEffect(() => {
    xmtpContext.closeClient();
    // only run this effect with the signer changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer]);

  return {
    client: xmtpContext.client,
    disconnect: xmtpContext.closeClient,
    error: xmtpContext.error,
    initialize: (keys?: InitClientArgs["keys"]) =>
      xmtpContext.initClient({ keys, options, signer }),
    isLoading: xmtpContext.isLoading,
  };
};

import "./App.css";
import { useClient } from "@xmtp/react-sdk";
import { useWallet } from "../hooks/useWallet";
import { XMTPConnect } from "./XMTPConnect";
import { WalletConnect } from "./WalletConnect";
import { Inbox } from "./Inbox";

export const ContentRouter = () => {
  const { isConnected, signer } = useWallet();
  const { client } = useClient({ signer });

  if (!isConnected) {
    return <WalletConnect />;
  }

  if (!client) {
    return <XMTPConnect />;
  }

  return <Inbox />;
};

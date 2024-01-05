import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LinkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Notification } from "./Notification";
import { useWallet } from "../hooks/useWallet";

export const WalletConnect: React.FC = () => {
  const { error, isLoading } = useWallet();

  if (error) {
    return (
      <Notification
        icon={<ExclamationTriangleIcon />}
        title="Error connecting to wallet"
        cta={<ConnectButton />}>
        Try connecting again
      </Notification>
    );
  }

  if (isLoading) {
    return (
      <Notification icon={<LinkIcon />} title="Connecting to wallet">
        Awaiting wallet connection...
      </Notification>
    );
  }

  return (
    <Notification
      icon={<LinkIcon />}
      title="No wallet connected"
      cta={<ConnectButton />}>
      Please connect a wallet to begin
    </Notification>
  );
};

import { LinkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useClient } from "@xmtp/react-sdk";
import { useCallback } from "react";
import { useWalletClient } from "wagmi";
import { Notification } from "./Notification";
import { Button } from "./library/Button";

type XMTPConnectButtonProps = {
  label: string;
};

const XMTPConnectButton: React.FC<XMTPConnectButtonProps> = ({ label }) => {
  const { initialize } = useClient();
  const { data: walletClient } = useWalletClient();

  const handleConnect = useCallback(() => {
    void initialize({
      signer: walletClient,
      options: {
        env: "dev",
      },
    });
  }, [initialize, walletClient]);

  return <Button onClick={handleConnect}>{label}</Button>;
};

export const XMTPConnect: React.FC = () => {
  const { isLoading, error } = useClient();

  if (error) {
    return (
      <Notification
        icon={<ExclamationTriangleIcon />}
        title="Could not connect to XMTP"
        cta={<XMTPConnectButton label="Try again" />}>
        Something went wrong
      </Notification>
    );
  }

  if (isLoading) {
    return (
      <Notification icon={<LinkIcon />} title="Connecting to XMTP">
        Awaiting signatures...
      </Notification>
    );
  }

  return (
    <Notification
      icon={<LinkIcon />}
      title="XMTP not connected"
      cta={<XMTPConnectButton label="Connect" />}>
      Connect to XMTP to continue
    </Notification>
  );
};

import { LinkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useClient } from "@xmtp/react-sdk";
import { useCallback } from "react";
import { Notification } from "./Notification";
import { useWallet } from "../hooks/useWallet";

type XMTPConnectButtonProps = {
  label: string;
};

const XMTPConnectButton: React.FC<XMTPConnectButtonProps> = ({ label }) => {
  const { signer } = useWallet();
  const { initialize } = useClient({ signer });

  const handleConnect = useCallback(() => {
    void initialize();
  }, [initialize]);

  return (
    <button className="Button" type="button" onClick={handleConnect}>
      {label}
    </button>
  );
};

export const XMTPConnect: React.FC = () => {
  const { signer } = useWallet();
  const { isLoading, error } = useClient({ signer });

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

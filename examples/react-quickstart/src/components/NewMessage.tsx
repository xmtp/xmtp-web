import {
  isValidAddress,
  useCanMessage,
  useStartConversation,
} from "@xmtp/react-sdk";
import { AddressInput, MessageInput } from "@xmtp/react-components";
import type { CachedConversation } from "@xmtp/react-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import "./NewMessage.css";

type NewMessageProps = {
  onSuccess?: (conversation?: CachedConversation) => void;
};

export const NewMessage: React.FC<NewMessageProps> = ({ onSuccess }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [peerAddress, setPeerAddress] = useState("");
  const [isOnNetwork, setIsOnNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { startConversation } = useStartConversation();
  const { canMessage } = useCanMessage();

  const handleChange = useCallback((updatedValue: string) => {
    setPeerAddress(updatedValue);
  }, []);

  const handleStartConversation = useCallback(
    async (message: string) => {
      if (peerAddress && isOnNetwork) {
        setIsLoading(true);
        const result = await startConversation(peerAddress, message);
        setIsLoading(false);
        if (result) {
          onSuccess?.(result.cachedConversation);
        }
      }
    },
    [isOnNetwork, onSuccess, peerAddress, startConversation],
  );

  useEffect(() => {
    const checkAddress = async () => {
      if (isValidAddress(peerAddress)) {
        setIsLoading(true);
        setIsOnNetwork(await canMessage(peerAddress));
        setIsLoading(false);
      } else {
        setIsOnNetwork(false);
      }
    };
    void checkAddress();
  }, [canMessage, peerAddress]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  let subtext: string | undefined;
  let isError = false;
  if (peerAddress === "") {
    subtext = "Enter a 0x wallet address";
  } else if (isLoading) {
    subtext = "Finding address on the XMTP network...";
  } else if (!isValidAddress(peerAddress)) {
    subtext = "Please enter a valid 0x wallet address";
  } else if (!isOnNetwork) {
    subtext =
      "Sorry, we can't message this address because its owner hasn't used it with XMTP yet";
    isError = true;
  }

  return (
    <>
      <AddressInput
        ref={inputRef}
        subtext={subtext}
        value={peerAddress}
        onChange={handleChange}
        isError={isError}
        avatarUrlProps={{
          address: isOnNetwork ? peerAddress : "",
        }}
      />
      <div />
      <div className="NewMessageInputWrapper">
        <MessageInput
          isDisabled={isLoading || !isValidAddress(peerAddress) || isError}
          onSubmit={handleStartConversation}
        />
      </div>
    </>
  );
};

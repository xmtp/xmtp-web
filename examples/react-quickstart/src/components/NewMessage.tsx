import {
  AddressInput,
  Messages as ConversationMessages,
  MessageInput,
  isValidAddress,
  useCanMessage,
  useStartConversation,
} from "@xmtp/react-sdk";
import type { Conversation } from "@xmtp/xmtp-js";
import { useCallback, useEffect, useRef, useState } from "react";

type NewMessageProps = {
  onSuccess?: (conversation?: Conversation) => void;
};

export const NewMessage: React.FC<NewMessageProps> = ({ onSuccess }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [peerAddress, setPeerAddress] = useState("");
  const [isOnNetwork, setIsOnNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startConversation = useStartConversation();
  const { canMessage } = useCanMessage();

  const handleChange = useCallback((updatedValue: string) => {
    setPeerAddress(updatedValue);
  }, []);

  const handleStartConversation = useCallback(
    async (message: string) => {
      if (peerAddress && isOnNetwork) {
        setIsLoading(true);
        const conversation = await startConversation(peerAddress, message);
        setIsLoading(false);
        onSuccess?.(conversation);
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
  if (!isValidAddress(peerAddress)) {
    subtext = "Please enter a valid wallet address";
  } else if (!isOnNetwork) {
    subtext = "Address is not on the XMTP network";
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
      <ConversationMessages />
      <MessageInput
        isDisabled={isLoading || !isValidAddress(peerAddress) || isError}
        onSubmit={handleStartConversation}
      />
    </>
  );
};

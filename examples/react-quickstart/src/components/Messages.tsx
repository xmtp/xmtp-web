import {
  useMessages,
  useSendMessage,
  useStreamMessages,
} from "@xmtp/react-sdk";
import type { Conversation, DecodedMessage } from "@xmtp/react-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import "./Messages.css";
import {
  AddressInput,
  ConversationMessages,
  MessageInput,
} from "@xmtp/react-components";

type ConversationMessagesProps = {
  conversation: Conversation;
};

export const Messages: React.FC<ConversationMessagesProps> = ({
  conversation,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [streamedMessages, setStreamedMessages] = useState<DecodedMessage[]>(
    [],
  );
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isLoading } = useMessages(conversation);
  const onMessage = useCallback(
    (message: DecodedMessage) => {
      // prevent duplicates
      if (!streamedMessages.some((msg) => msg.id === message.id)) {
        setStreamedMessages((prev) => [...prev, message]);
      }
    },
    [streamedMessages],
  );
  useStreamMessages(conversation, onMessage);
  const { sendMessage } = useSendMessage(conversation);

  const handleSendMessage = useCallback(
    async (message: string) => {
      setIsSending(true);
      await sendMessage(message);
      setIsSending(false);
      // ensure focus of input by waiting for a browser tick
      setTimeout(() => messageInputRef.current?.focus(), 0);
    },
    [sendMessage],
  );

  useEffect(() => {
    messageInputRef.current?.focus();
    setStreamedMessages([]);
  }, [conversation]);

  return (
    <>
      <AddressInput
        value={conversation.peerAddress}
        avatarUrlProps={{ address: conversation.peerAddress }}
      />
      <ConversationMessages
        isLoading={isLoading}
        messages={[...messages, ...streamedMessages]}
        clientAddress={conversation?.clientAddress ?? ""}
      />
      <div className="MessageInputWrapper">
        <MessageInput
          isDisabled={isSending}
          onSubmit={handleSendMessage}
          ref={messageInputRef}
        />
      </div>
    </>
  );
};

import {
  AddressInput,
  ConversationMessages,
  MessageInput,
  useMessages,
  useSendMessage,
  useStreamMessages,
} from "@xmtp/react-sdk";
import type { Conversation } from "@xmtp/xmtp-js";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { Notification } from "./Notification";

type ConversationMessagesProps = {
  conversation?: Conversation;
  onStartNewConversation?: VoidFunction;
};

export const Messages: React.FC<ConversationMessagesProps> = ({
  conversation,
  onStartNewConversation,
}) => {
  const [isSending, setIsSending] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isLoading } = useMessages(conversation);
  const { messages: streamedMessages } = useStreamMessages(conversation);
  const sendMessage = useSendMessage(conversation);

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
  }, [conversation]);

  if (!conversation) {
    return (
      <Notification
        cta={
          <button
            className="Button"
            type="button"
            onClick={onStartNewConversation}>
            Start new conversation
          </button>
        }
        icon={<ChatBubbleLeftRightIcon />}
        title="No conversation selected">
        Select a conversation to display its messages or start a new
        conversation
      </Notification>
    );
  }

  const allMessages = [...messages, ...streamedMessages];

  return (
    <>
      <AddressInput
        value={conversation.peerAddress}
        avatarUrlProps={{ address: conversation.peerAddress }}
      />
      <ConversationMessages
        isLoading={isLoading}
        messages={allMessages}
        clientAddress={conversation?.clientAddress ?? ""}
      />
      <MessageInput
        isDisabled={isSending}
        onSubmit={handleSendMessage}
        ref={messageInputRef}
      />
    </>
  );
};

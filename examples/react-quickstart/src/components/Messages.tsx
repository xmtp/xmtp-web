import {
  ContentTypeId,
  useClient,
  useMessages,
  useSendMessage,
  useStreamMessages,
} from "@xmtp/react-sdk";
import type { CachedConversation } from "@xmtp/react-sdk";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import "./Messages.css";
import {
  AddressInput,
  Messages as MessagesList,
  MessageInput,
} from "@xmtp/react-components";

type ConversationMessagesProps = {
  conversation: CachedConversation;
};

export const Messages: React.FC<ConversationMessagesProps> = ({
  conversation,
}) => {
  const [isSending, setIsSending] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isLoading } = useMessages(conversation);
  const { client } = useClient();
  useStreamMessages(conversation);
  const { sendMessage } = useSendMessage();

  const filteredMessages = useMemo(
    () =>
      messages.filter((message) => {
        const contentType = ContentTypeId.fromString(message.contentType);
        return (
          // supported content types
          message.content !== undefined &&
          // not reactions
          !contentType.sameAs(ContentTypeReaction) &&
          // not read receipts
          !contentType.sameAs(ContentTypeReadReceipt)
        );
      }),
    [messages],
  );

  const handleSendMessage = useCallback(
    async (message: string) => {
      setIsSending(true);
      await sendMessage(conversation, message);
      setIsSending(false);
      // ensure focus of input by waiting for a browser tick
      setTimeout(() => messageInputRef.current?.focus(), 0);
    },
    [conversation, sendMessage],
  );

  useEffect(() => {
    messageInputRef.current?.focus();
  }, [conversation]);

  return (
    <>
      <AddressInput
        value={conversation.peerAddress}
        avatarUrlProps={{ address: conversation.peerAddress }}
      />
      <MessagesList
        conversation={conversation}
        isLoading={isLoading}
        messages={filteredMessages}
        clientAddress={client?.address}
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

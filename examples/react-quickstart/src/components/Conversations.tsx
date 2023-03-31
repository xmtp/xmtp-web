import {
  ConversationPreviewList,
  useConversations,
  useStreamConversations,
} from "@xmtp/react-sdk";
import type { Conversation } from "@xmtp/xmtp-js";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { Notification } from "./Notification";

type ConversationsProps = {
  selectedConversation?: Conversation;
  onConversationClick?: (conversation: Conversation) => void;
};

const NoConversations: React.FC = () => (
  <Notification icon={<ChatBubbleLeftIcon />} title="No conversations found">
    It looks like you don&rsquo;t have any conversations yet. Create one to get
    started
  </Notification>
);

export const Conversations: React.FC<ConversationsProps> = ({
  onConversationClick,
  selectedConversation,
}) => {
  const [streamedConversations, setStreamedConversations] = useState<
    Conversation[]
  >([]);
  const { conversations, isLoading } = useConversations();
  const onConversation = useCallback(
    (conversation: Conversation) => {
      // prevent duplicates
      if (!conversations.some((convo) => convo.topic === conversation.topic)) {
        setStreamedConversations((prev) => [...prev, conversation]);
      }
    },
    [conversations],
  );
  useStreamConversations(onConversation);

  return (
    <ConversationPreviewList
      isLoading={isLoading}
      conversations={[...conversations, ...streamedConversations]}
      onConversationClick={onConversationClick}
      renderEmpty={<NoConversations />}
      selectedConversation={selectedConversation}
    />
  );
};

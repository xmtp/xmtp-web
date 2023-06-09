import type { Conversation } from "@xmtp/react-sdk";
import { isAfter, isBefore } from "date-fns";
import { ConversationPreview } from "./ConversationPreview";
import type { ConversationListProps } from "../components/ConversationList";
import { ConversationList } from "../components/ConversationList";

export type ConversationPreviewListProps = Pick<
  ConversationListProps,
  "isLoading" | "renderEmpty"
> & {
  /**
   * What conversations should we render?
   */
  conversations?: Conversation[];
  /**
   * What happens when a conversation is clicked?
   */
  onConversationClick?: (conversation: Conversation) => void;
  /**
   * What, if any, conversation is selected
   */
  selectedConversation?: Conversation;
};

/**
 * This component sorts conversations by most recent, then lists them as
 * conversation previews, which include the conversation's first message.
 */
export const ConversationPreviewList: React.FC<
  ConversationPreviewListProps
> = ({
  conversations = [],
  isLoading,
  onConversationClick,
  renderEmpty,
  selectedConversation,
}) => {
  const conversationPreviews = conversations
    // order by most recent
    .sort((a, b) => {
      if (isBefore(a.createdAt, b.createdAt)) {
        return 1;
      }
      if (isAfter(a.createdAt, b.createdAt)) {
        return -1;
      }
      return 0;
    })
    .map((conversation) => (
      <ConversationPreview
        key={conversation.topic}
        conversation={conversation}
        isSelected={conversation.topic === selectedConversation?.topic}
        onClick={onConversationClick}
      />
    ));
  return (
    <ConversationList
      conversations={conversationPreviews}
      isLoading={isLoading}
      renderEmpty={renderEmpty}
    />
  );
};

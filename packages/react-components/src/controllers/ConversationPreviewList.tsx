import type { CachedConversation } from "@xmtp/react-sdk";
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
  conversations?: CachedConversation[];
  /**
   * What happens when a conversation is clicked?
   */
  onConversationClick?: (conversation: CachedConversation) => void;
  /**
   * What, if any, conversation is selected
   */
  selectedConversation?: CachedConversation;
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
  const conversationPreviews = conversations.map((conversation) => (
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

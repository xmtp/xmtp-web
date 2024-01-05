import type {
  CachedConversation,
  CachedMessage,
  ConsentState,
} from "@xmtp/react-sdk";
import { useCallback } from "react";
import { ConversationPreviewCard } from "../components/library/ConversationPreviewCard";

type ConversationPreviewProps = {
  /**
   * Conversation to preview
   */
  conversation: CachedConversation;
  /**
   * Is conversation selected?
   */
  isSelected?: boolean;
  /**
   * What happens when you click on the conversation?
   */
  onClick?: (conversation: CachedConversation) => void;
  /**
   * Preview text to display
   */
  lastMessage?: CachedMessage;
  consentState: ConsentState;
};

/**
 * This component fetches the most recent conversation message and uses it to
 * render a conversation preview.
 */
export const ConversationPreview: React.FC<ConversationPreviewProps> = ({
  conversation,
  isSelected,
  onClick,
  lastMessage,
  consentState,
}) => {
  const handlePreviewClick = useCallback(() => {
    onClick?.(conversation);
  }, [conversation, onClick]);

  return (
    <ConversationPreviewCard
      consentState={consentState}
      conversation={conversation}
      isSelected={isSelected}
      onClick={handlePreviewClick}
      lastMessage={lastMessage}
    />
  );
};

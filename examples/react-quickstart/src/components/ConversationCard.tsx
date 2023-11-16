import type { CachedConversation } from "@xmtp/react-sdk";
import { useLastMessage, useConsent } from "@xmtp/react-sdk";
import { ConversationPreview } from "@xmtp/react-components";

type ConversationCardProps = {
  conversation: CachedConversation;
  isSelected: boolean;
  onConversationClick?: (conversation: CachedConversation) => void;
};

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onConversationClick,
  isSelected,
}) => {
  const lastMessage = useLastMessage(conversation.topic);
  const { consentState } = useConsent();

  return (
    <ConversationPreview
      key={conversation.topic}
      conversation={conversation}
      isSelected={isSelected}
      onClick={onConversationClick}
      lastMessage={lastMessage}
      consentState={consentState(conversation.peerAddress)}
    />
  );
};

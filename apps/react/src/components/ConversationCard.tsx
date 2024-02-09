import type { CachedConversation, ConsentState } from "@xmtp/react-sdk";
import { useLastMessage, useConsent } from "@xmtp/react-sdk";
import { useEffect, useState } from "react";
import { ConversationPreview } from "../controllers/ConversationPreview";

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
  const [consentState, setConsentState] = useState<ConsentState>("unknown");
  const lastMessage = useLastMessage(conversation.topic);
  const { consentState: _consentState } = useConsent();

  useEffect(() => {
    const getState = async () => {
      setConsentState(await _consentState(conversation.peerAddress));
    };
    void getState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConversationPreview
      key={conversation.topic}
      conversation={conversation}
      isSelected={isSelected}
      onClick={onConversationClick}
      lastMessage={lastMessage}
      consentState={consentState}
    />
  );
};

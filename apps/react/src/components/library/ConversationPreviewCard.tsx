import type { KeyboardEvent } from "react";
import { useCallback } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { getAttachment, useConsent } from "@xmtp/react-sdk";
import type {
  ConsentState,
  CachedConversation,
  CachedMessage,
} from "@xmtp/react-sdk";
import { Avatar } from "./Avatar";
import styles from "./ConversationPreviewCard.module.css";
import { shortAddress } from "../../helpers/shortAddress";

type ConversationPreviewCardProps = {
  /**
   * Conversation to preview
   */
  conversation: CachedConversation;
  /**
   * What is the last message of this conversation?
   */
  lastMessage?: CachedMessage;
  /**
   * What happens on message click?
   */
  onClick?: (conversation: CachedConversation) => void;
  /**
   * Is conversation selected?
   */
  isSelected?: boolean;
  consentState: ConsentState;
};

export const ConversationPreviewCard: React.FC<
  ConversationPreviewCardProps
> = ({ conversation, onClick, isSelected, lastMessage, consentState }) => {
  const { allow, deny } = useConsent();
  const attachment = lastMessage ? getAttachment(lastMessage) : undefined;
  let content: any;
  if (attachment) {
    content = attachment.filename;
  } else if (typeof lastMessage?.content === "string") {
    content = lastMessage.content;
  } else if (lastMessage?.contentFallback) {
    content = lastMessage.contentFallback;
  }
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        onClick?.(conversation);
      }
    },
    [conversation, onClick],
  );

  const handleClick = useCallback(() => {
    onClick?.(conversation);
  }, [conversation, onClick]);

  const handleAllow = useCallback(async () => {
    await allow([conversation.peerAddress]);
  }, [allow, conversation.peerAddress]);

  const handleDeny = useCallback(async () => {
    await deny([conversation.peerAddress]);
  }, [deny, conversation.peerAddress]);

  let consentStyle = "";
  if (consentState === "allowed") {
    consentStyle = styles.allow;
  } else if (consentState === "denied") {
    consentStyle = styles.deny;
  }

  return (
    <div
      className={`${styles.wrapper} ${isSelected ? styles.selected : ""}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}>
      <Avatar address={conversation.peerAddress} />
      <div className={styles.element}>
        <div className={styles.address}>
          {shortAddress(conversation.peerAddress)}
        </div>
        <div className={styles.message}>{content}</div>
      </div>
      <div className={styles.extra}>
        <div className={styles.time}>
          {lastMessage?.sentAt &&
            `${formatDistanceToNowStrict(lastMessage.sentAt)} ago`}
        </div>
        <div className={`${styles.consent} ${consentStyle}`}>
          {consentState}
        </div>
        <div className={`${styles.actions}`}>
          <div
            tabIndex={0}
            role="button"
            className={`${styles.action}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleAllow();
              }
            }}
            onClick={() => {
              void handleAllow();
            }}>
            Allow
          </div>
          <div
            className={`${styles.action} `}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleDeny();
              }
            }}
            onClick={() => {
              void handleDeny();
            }}>
            Deny
          </div>
        </div>
      </div>
    </div>
  );
};

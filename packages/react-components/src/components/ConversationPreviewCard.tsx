import type { KeyboardEvent } from "react";
import { useCallback } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import {
  type CachedConversation,
  type CachedMessage,
  getAttachment,
} from "@xmtp/react-sdk";
import { Avatar } from "./Avatar";
import styles from "./ConversationPreviewCard.module.css";
import { shortAddress } from "../helpers/shortAddress";

export type ConversationPreviewCardProps = {
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
};

export const ConversationPreviewCard: React.FC<
  ConversationPreviewCardProps
> = ({ conversation, onClick, isSelected, lastMessage }) => {
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
      <div className={styles.time}>
        {lastMessage?.sentAt &&
          `${formatDistanceToNowStrict(lastMessage.sentAt)} ago`}
      </div>
    </div>
  );
};

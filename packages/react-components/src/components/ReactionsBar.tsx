import { useSendMessage } from "@xmtp/react-sdk";
import type { CachedMessage, CachedConversation } from "@xmtp/react-sdk";
import { useCallback } from "react";
import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import styles from "./ReactionsBar.module.css";

export type ReactionsBarProps = {
  conversation: CachedConversation;
  message: CachedMessage;
};

const availableReactionEmojis = ["👍", "👎", "❤️"];

export const ReactionsBar: React.FC<ReactionsBarProps> = ({
  conversation,
  message,
}) => {
  const { sendMessage } = useSendMessage();
  const handleClick = useCallback(
    (emoji: string) => {
      void sendMessage<Reaction>(
        conversation,
        {
          content: emoji,
          schema: "unicode",
          reference: message.xmtpID,
          action: "added",
        },
        ContentTypeReaction,
      );
    },
    [conversation, message.xmtpID, sendMessage],
  );

  return (
    <div className={styles.wrapper}>
      {availableReactionEmojis.map((emoji) => (
        <button
          type="button"
          key={emoji}
          className={styles.option}
          onClick={() => handleClick(emoji)}>
          <span className={styles.emoji}>{emoji}</span>
        </button>
      ))}
    </div>
  );
};

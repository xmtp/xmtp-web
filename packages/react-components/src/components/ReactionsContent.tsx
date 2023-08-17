import {
  type CachedConversation,
  type CachedMessage,
  useSendMessage,
  useClient,
  useReactions,
} from "@xmtp/react-sdk";
import { useCallback, useMemo } from "react";
import type { Reaction } from "@xmtp/content-type-reaction";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import styles from "./ReactionsContent.module.css";

export type ReactionsContentProps = {
  conversation: CachedConversation;
  message: CachedMessage;
};

const availableReactionEmojis = ["👍", "👎", "❤️"];

export const ReactionsContent: React.FC<ReactionsContentProps> = ({
  conversation,
  message,
}) => {
  const { client } = useClient();
  const { sendMessage } = useSendMessage();
  const reactions = useReactions(message);

  const emojiReactions = useMemo(
    () =>
      reactions
        .filter((reaction) => reaction.schema === "unicode")
        .reduce(
          (acc, reaction) => {
            const count = (acc?.[reaction.content]?.count ?? 0) + 1;
            const senderAddresses =
              acc?.[reaction.content]?.senderAddresses ?? [];
            return {
              ...acc,
              [reaction.content]: {
                count,
                senderAddresses: [...senderAddresses, reaction.senderAddress],
              },
            };
          },
          {} as Record<
            string,
            {
              count: number;
              senderAddresses: string[];
            }
          >,
        ),
    [reactions],
  );

  const emojiCount = useCallback(
    (emoji: string) => emojiReactions[emoji]?.count ?? 0,
    [emojiReactions],
  );

  const handleClick = useCallback(
    (emoji: string) => {
      const hasReacted = emojiReactions[emoji].senderAddresses.includes(
        client?.address ?? "",
      );
      void sendMessage<Reaction>(
        conversation,
        {
          content: emoji,
          schema: "unicode",
          reference: message.xmtpID,
          action: hasReacted ? "removed" : "added",
        },
        ContentTypeReaction,
      );
    },
    [
      client?.address,
      conversation,
      emojiReactions,
      message.xmtpID,
      sendMessage,
    ],
  );

  return (
    reactions.length > 0 && (
      <div className={styles.wrapper}>
        {availableReactionEmojis.map((emoji) => {
          const count = emojiCount(emoji);
          return count > 0 ? (
            <button
              type="button"
              key={emoji}
              className={`${styles.option} ${styles.active}`}
              onClick={() => handleClick(emoji)}>
              <span className={styles.emoji}>{emoji}</span>
              <span className={styles.count}>{count}</span>
            </button>
          ) : null;
        })}
      </div>
    )
  );
};

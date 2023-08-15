import { format } from "date-fns";
import { ContentTypeId } from "@xmtp/react-sdk";
import type { CachedConversation, CachedMessage } from "@xmtp/react-sdk";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import styles from "./Message.module.css";
import { MessageContent } from "./MessageContent";
import { ReplyContent } from "./ReplyContent";
import { ReactionsBar } from "./ReactionsBar";
import { ReactionsContent } from "./ReactionsContent";

export type MessageProps = {
  conversation: CachedConversation;
  /**
   * The message to display
   */
  message: CachedMessage;
  /**
   * Is this an incoming message?
   */
  isIncoming?: boolean;
  isRead?: boolean;
};

export const Message: React.FC<MessageProps> = ({
  conversation,
  message,
  isIncoming,
  isRead,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  return (
    <div
      className={`${styles.wrapper} ${styles[isIncoming ? "left" : "right"]}`}>
      {contentType.sameAs(ContentTypeReply) ? (
        <ReplyContent message={message} isIncoming={isIncoming} />
      ) : (
        <MessageContent message={message} isIncoming={isIncoming} />
      )}
      <div className={styles.time} title={message.sentAt.toLocaleString()}>
        {isRead && <span className={styles.readReceipt}>Read</span>}
        <span>{format(message.sentAt, "h:mm a")}</span>
      </div>
      <div className={styles.reactions}>
        <ReactionsBar conversation={conversation} message={message} />
      </div>
      <ReactionsContent conversation={conversation} message={message} />
    </div>
  );
};

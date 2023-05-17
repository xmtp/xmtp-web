import { format } from "date-fns";
import styles from "./Message.module.css";

export type MessageProps = {
  /**
   * What is the content of the message?
   */
  content: React.ReactNode;
  /**
   * What is the datetime of the message?
   */
  datetime: Date;
  /**
   * Is this an incoming message?
   */
  isIncoming?: boolean;
};

export const Message: React.FC<MessageProps> = ({
  content,
  datetime,
  isIncoming,
}) => (
  <div className={`${styles.wrapper} ${styles[isIncoming ? "left" : "right"]}`}>
    <div className={styles.content} data-testid="message-tile-text">
      {content}
    </div>
    <div className={styles.time} title={datetime.toLocaleString()}>
      {format(datetime, "h:mm a")}
    </div>
  </div>
);

import { isBefore, isEqual, isSameDay } from "date-fns";
import { Fragment, useMemo } from "react";
import {
  getReadReceipt,
  type CachedConversation,
  type CachedMessage,
  useClient,
} from "@xmtp/react-sdk";
import { MessageSkeletonLoader } from "./SkeletonLoaders/MessageSkeletonLoader";
import { Message } from "./Message";
import { DateDivider } from "./DateDivider";
import styles from "./Messages.module.css";

export type MessagesProps = {
  conversation: CachedConversation;
  /**
   * What's the client's wallet address?
   */
  clientAddress?: string;
  /**
   * Are the messages loading?
   */
  isLoading?: boolean;
  /**
   * What messages should be displayed?
   */
  messages?: CachedMessage[];
};

export const Messages: React.FC<MessagesProps> = ({
  clientAddress = "",
  conversation,
  isLoading = false,
  messages = [],
}) => {
  const { client } = useClient();

  // get the last read message of a client's outgoing messages
  const lastReadMessage = useMemo(() => {
    const readReceipt = getReadReceipt(conversation, "incoming");
    const outgoingMessages = messages.filter(
      (message) => message.senderAddress === client?.address,
    );
    let lastRead: CachedMessage | undefined;
    // there's no read messages without a read receipt
    if (readReceipt) {
      outgoingMessages.some((message) => {
        // outgoing message is before or equal to the read receipt date
        if (
          isBefore(message.sentAt, readReceipt) ||
          isEqual(message.sentAt, readReceipt)
        ) {
          lastRead = message;
          return true;
        }
        // outgoing message comes after read receipt, stop checking
        return false;
      });
    }
    return lastRead;
  }, [client?.address, conversation, messages]);

  if (isLoading && !messages.length) {
    return (
      <div className={styles.loading}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <Fragment key={idx}>
            <MessageSkeletonLoader incoming={false} /> <MessageSkeletonLoader />
          </Fragment>
        ))}
      </div>
    );
  }

  const renderedDates: Date[] = [];

  return (
    <div data-testid="message-tile-container" className={styles.wrapper}>
      {messages.map((message, idx, filteredMessages) => {
        if (renderedDates.length === 0) {
          renderedDates.push(message.sentAt);
        }
        const lastRenderedDate = renderedDates.at(-1) as Date;
        const isIncoming = message.senderAddress !== clientAddress;
        const isFirstMessage = idx === 0;
        const isLastMessage = idx === filteredMessages.length - 1;
        const isSameDate = isSameDay(lastRenderedDate, message.sentAt);
        const shouldDisplayDate =
          isFirstMessage || isLastMessage || !isSameDate;

        if (shouldDisplayDate && !isLastMessage) {
          renderedDates.push(message.sentAt);
        }

        return (
          <Fragment key={message.id}>
            {shouldDisplayDate && (
              <DateDivider date={renderedDates.at(-1) as Date} />
            )}
            <Message
              key={message.id}
              conversation={conversation}
              message={message}
              isIncoming={isIncoming}
              isRead={lastReadMessage?.xmtpID === message.xmtpID}
            />
          </Fragment>
        );
      })}
    </div>
  );
};

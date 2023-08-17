import { isAfter, isBefore, isSameDay } from "date-fns";
import { Fragment, useMemo } from "react";
import {
  getReadReceipt,
  type CachedConversation,
  type CachedMessage,
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

// TODO: account for messages sent at the same time
const hasMessageReadAfter = (
  messages: CachedMessage[],
  afterSent: Date,
  readReceipt: Date,
) =>
  messages.some(
    (message) =>
      isAfter(message.sentAt, afterSent) &&
      isBefore(message.sentAt, readReceipt),
  );

export const Messages: React.FC<MessagesProps> = ({
  clientAddress = "",
  conversation,
  isLoading = false,
  messages = [],
}) => {
  const outgoingMessages = useMemo(
    () => messages.filter((message) => message.senderAddress === clientAddress),
    [messages, clientAddress],
  );

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
  const readReceipt = getReadReceipt(conversation);

  return (
    <div data-testid="message-tile-container" className={styles.wrapper}>
      {messages.map((message, idx, filteredMessages) => {
        if (renderedDates.length === 0) {
          renderedDates.push(message.sentAt);
        }
        const lastRenderedDate = renderedDates.at(-1) as Date;
        const isIncoming = message.senderAddress !== clientAddress;
        const isOutgoing = message.senderAddress === clientAddress;
        const isFirstMessage = idx === 0;
        const isLastMessage = idx === filteredMessages.length - 1;
        const isSameDate = isSameDay(lastRenderedDate, message.sentAt);
        const shouldDisplayDate =
          isFirstMessage || isLastMessage || !isSameDate;

        if (shouldDisplayDate && !isLastMessage) {
          renderedDates.push(message.sentAt);
        }

        // determine if this message should display a read receipt, which
        // we only want to display on the last read outgoing message
        const isRead =
          // conversation must have a valid read receipt, and...
          readReceipt &&
          // this message must be outgoing, and...
          isOutgoing &&
          // this message must be sent before the read receipt, and...
          isBefore(message.sentAt, readReceipt) &&
          // this message is the last message, or...
          (isLastMessage ||
            // the next outgoing message was sent after the read receipt
            !hasMessageReadAfter(
              outgoingMessages,
              message.sentAt,
              readReceipt,
            ));

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
              isRead={isRead}
            />
          </Fragment>
        );
      })}
    </div>
  );
};

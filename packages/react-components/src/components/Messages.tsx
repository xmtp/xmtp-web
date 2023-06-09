import type { DecodedMessage } from "@xmtp/react-sdk";
import { isSameDay } from "date-fns";
import { Fragment } from "react";
import { MessageSkeletonLoader } from "./SkeletonLoaders/MessageSkeletonLoader";
import { Message } from "./Message";
import { DateDivider } from "./DateDivider";
import styles from "./Messages.module.css";

export type MessageData = Pick<
  DecodedMessage,
  | "content"
  | "contentTopic"
  | "contentType"
  | "error"
  | "id"
  | "recipientAddress"
  | "senderAddress"
  | "sent"
>;

export type MessagesProps = {
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
  messages?: MessageData[];
};

export const Messages: React.FC<MessagesProps> = ({
  clientAddress = "",
  isLoading = false,
  messages = [],
}) => {
  if (isLoading) {
    return (
      <div className={styles.loading}>
        {Array.from({ length: 2 }).map((_, idx) => (
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
          renderedDates.push(message.sent);
        }
        const lastRenderedDate = renderedDates.at(-1) as Date;
        const isIncoming = message.senderAddress !== clientAddress;
        const isLastMessage = idx === filteredMessages.length - 1;
        const isSameDate = isSameDay(lastRenderedDate, message.sent);
        const shouldDisplayDate = isLastMessage || !isSameDate;

        if (shouldDisplayDate && !isLastMessage) {
          renderedDates.push(message.sent);
        }

        return (
          <Fragment key={message.id}>
            {shouldDisplayDate &&
              renderedDates.length > 1 &&
              (!isLastMessage || (isLastMessage && !isSameDate)) && (
                <DateDivider
                  date={
                    isLastMessage && !isSameDate
                      ? (renderedDates.at(-1) as Date)
                      : (renderedDates.at(-2) as Date)
                  }
                />
              )}
            <Message
              key={message.id}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              content={message.content}
              datetime={message.sent}
              isIncoming={isIncoming}
            />
            {shouldDisplayDate && isLastMessage && (
              <DateDivider date={renderedDates.at(-1) as Date} />
            )}
          </Fragment>
        );
      })}
      <div className={styles.beginning} data-testid="message-beginning-text">
        This is the beginning of the conversation
      </div>
    </div>
  );
};

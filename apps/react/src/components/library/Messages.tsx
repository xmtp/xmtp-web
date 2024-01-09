import { isSameDay } from "date-fns";
import { Fragment } from "react";
import type { CachedConversation, CachedMessage } from "@xmtp/react-sdk";
import { MessageSkeletonLoader } from "./SkeletonLoaders/MessageSkeletonLoader";
import { Message } from "./Message";
import { DateDivider } from "./DateDivider";
import styles from "./Messages.module.css";

type MessagesProps = {
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
            />
          </Fragment>
        );
      })}
    </div>
  );
};

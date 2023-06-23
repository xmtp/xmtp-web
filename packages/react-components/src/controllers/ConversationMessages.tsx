import type { DecodedMessage } from "@xmtp/react-sdk";
import { isAfter, isBefore } from "date-fns";
import { Messages } from "../components/Messages";

export type ConversationMessagesProps = {
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
  messages?: DecodedMessage[];
};

/**
 * This component filters empty messages, sorts them by most recent, and then
 * converts them into a more generic format to be consumed by the Messages
 * component.
 */
export const ConversationMessages: React.FC<ConversationMessagesProps> = ({
  clientAddress = "",
  isLoading = false,
  messages = [],
}) => (
  <Messages
    clientAddress={clientAddress}
    isLoading={isLoading}
    messages={messages
      // remove empty messages
      .filter((message) => message.content)
      // sort by most recent
      .sort((a, b) => {
        if (isBefore(a.sent, b.sent)) {
          return 1;
        }
        if (isAfter(a.sent, b.sent)) {
          return -1;
        }
        return 0;
      })
      .map(
        ({
          content,
          contentTopic,
          contentType,
          error,
          id,
          recipientAddress,
          senderAddress,
          sent,
        }) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          content,
          contentTopic,
          contentType,
          error,
          id,
          recipientAddress,
          senderAddress,
          sent,
        }),
      )}
  />
);

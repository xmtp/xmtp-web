import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { Notification } from "./Notification";

type NoSelectedConversationNotificationProps = {
  onStartNewConversation?: VoidFunction;
};

export const NoSelectedConversationNotification: React.FC<
  NoSelectedConversationNotificationProps
> = ({ onStartNewConversation }) => (
  <Notification
    cta={
      <button className="Button" type="button" onClick={onStartNewConversation}>
        Start new conversation
      </button>
    }
    icon={<ChatBubbleLeftRightIcon />}
    title="No conversation selected">
    Select a conversation to display its messages or start a new conversation
  </Notification>
);

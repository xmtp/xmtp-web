import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { Notification } from "./Notification";
import { Button } from "./library/Button";

type NoSelectedConversationNotificationProps = {
  onStartNewConversation?: VoidFunction;
};

export const NoSelectedConversationNotification: React.FC<
  NoSelectedConversationNotificationProps
> = ({ onStartNewConversation }) => (
  <Notification
    cta={
      <Button onClick={onStartNewConversation}>Start new conversation</Button>
    }
    icon={<ChatBubbleLeftRightIcon />}
    title="No conversation selected">
    Select a conversation to display its messages or start a new conversation
  </Notification>
);

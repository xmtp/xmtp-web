import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { Notification } from "./Notification";

type NoSelectedConversationProps = {
  onStartNewConversation?: VoidFunction;
};

export const NoSelectedConversation: React.FC<NoSelectedConversationProps> = ({
  onStartNewConversation,
}) => (
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

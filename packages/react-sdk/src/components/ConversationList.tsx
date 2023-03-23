import { ConversationPreviewCard } from "./ConversationPreviewCard";

export type ConversationListProps = {
  /**
   * What conversations should we render?
   */
  conversations?: React.ReactNode[];
  /**
   * Are we waiting on anything loading?
   */
  isLoading?: boolean;
  /**
   * What should we render when there are no conversations?
   */
  renderEmpty?: React.ReactNode;
};

const DefaultEmptyMessage: React.FC = () => <div>No conversations</div>;

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations = [],
  isLoading,
  renderEmpty = <DefaultEmptyMessage />,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col justify-start bg-gray-300 pl-16">
        {Array.from({ length: 12 }).map((_, idx) => (
          <ConversationPreviewCard key={idx} isLoading />
        ))}
      </div>
    );
  }

  if (!conversations.length && !isLoading) {
    return (
      <div className="sm:p-4 md:p-8 border border-gray-100 h-full pl-16">
        {renderEmpty}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-gray-100 pl-16"
      data-testid="conversations-list-panel">
      {conversations}
    </div>
  );
};

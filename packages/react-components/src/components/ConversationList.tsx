import { ConversationPreviewCard } from "./ConversationPreviewCard";
import styles from "./ConversationList.module.css";

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
      <div className={styles.loading}>
        {Array.from({ length: 12 }).map((_, idx) => (
          <ConversationPreviewCard key={idx} isLoading />
        ))}
      </div>
    );
  }

  if (!conversations.length && !isLoading) {
    return <div className={styles.empty}>{renderEmpty}</div>;
  }

  return (
    <div className={styles.wrapper} data-testid="conversations-list-panel">
      {conversations}
    </div>
  );
};

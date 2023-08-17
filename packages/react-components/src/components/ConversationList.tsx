import { Avatar } from "./Avatar";
import styles from "./ConversationList.module.css";
import previewStyles from "./ConversationPreviewCard.module.css";
import { IconSkeletonLoader } from "./SkeletonLoaders/IconSkeletonLoader";
import { ShortCopySkeletonLoader } from "./SkeletonLoaders/ShortCopySkeletonLoader";

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

const DefaultEmptyMessage: React.FC = () => <div>No conversations!</div>;

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations = [],
  isLoading,
  renderEmpty = <DefaultEmptyMessage />,
}) => {
  if (isLoading && !conversations.length) {
    return (
      <div className={previewStyles.wrapper}>
        <Avatar isLoading />
        <div className={previewStyles.element}>
          <ShortCopySkeletonLoader lines={2} />
        </div>
        <IconSkeletonLoader />
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

import type { KeyboardEvent } from "react";
import { useCallback } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { IconSkeletonLoader } from "./SkeletonLoaders/IconSkeletonLoader";
import { ShortCopySkeletonLoader } from "./SkeletonLoaders/ShortCopySkeletonLoader";
import { Avatar } from "./Avatar";
import styles from "./ConversationPreviewCard.module.css";

export type ConversationPreviewCardProps = {
  /**
   * What is the avatar url?
   */
  avatarUrl?: string;
  /**
   * What is the message text?
   */
  text?: string;
  /**
   * What is the display address associated with the message?
   */
  displayAddress?: string;
  /**
   * What is the wallet address associated with the message?
   */
  address?: string;
  /**
   * What is the datetime of the message
   */
  datetime?: Date;
  /**
   * Are we waiting on anything loading?
   */
  isLoading?: boolean;
  /**
   * What happens on message click?
   */
  onClick?: () => void;
  /**
   * Is conversation selected?
   */
  isSelected?: boolean;
  /**
   * What is the app this conversation started on?
   */
  conversationDomain?: string;
  // To-do: Add error views once we have the designs
};

export const ConversationPreviewCard: React.FC<
  ConversationPreviewCardProps
> = ({
  avatarUrl,
  text,
  displayAddress,
  address,
  datetime,
  isLoading = false,
  onClick,
  isSelected,
  conversationDomain,
}) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        onClick?.();
      }
    },
    [onClick],
  );

  // nothing to display
  if (!text && !isLoading) {
    return null;
  }

  return (
    <div
      className={`${styles.wrapper} ${isSelected ? styles.selected : ""} ${
        isLoading ? styles.loading : ""
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={onClick}>
      <Avatar url={avatarUrl} address={address} isLoading={isLoading} />
      <div className={styles.element}>
        {!isLoading && conversationDomain && (
          <div className={styles.domain}>{conversationDomain}</div>
        )}
        {isLoading ? (
          <ShortCopySkeletonLoader lines={2} />
        ) : (
          <>
            <div className={styles.address}>{displayAddress}</div>
            <div className={styles.message}>{text}</div>
          </>
        )}
      </div>
      {isLoading ? (
        <IconSkeletonLoader />
      ) : (
        <div className={styles.time}>
          {datetime && `${formatDistanceToNowStrict(datetime)} ago`}
        </div>
      )}
    </div>
  );
};

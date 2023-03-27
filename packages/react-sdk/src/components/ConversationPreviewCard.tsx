import type { KeyboardEvent } from "react";
import { useCallback } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { IconSkeletonLoader } from "./SkeletonLoaders/IconSkeletonLoader";
import { ShortCopySkeletonLoader } from "./SkeletonLoaders/ShortCopySkeletonLoader";
import { Avatar } from "./Avatar";
import { shortAddress } from "../helpers/shortAddress";

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
  text = "New message",
  displayAddress = "New recipient",
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
      className={`flex items-start border border-t-0 border-gray-200 outline-blue outline-b-0 p-4 h-min cursor-pointer ${
        isSelected ? "bg-gray-200" : "bg-gray-100"
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={onClick}>
      <div className="mr-3 flex-none">
        <Avatar
          url={avatarUrl}
          address={displayAddress}
          isLoading={isLoading}
        />
      </div>
      <div className="flex flex-col items-start flex-grow overflow-hidden">
        {!isLoading && conversationDomain && (
          <div className="text-sm mb-1 text-white px-2 rounded-lg bg-indigo-600">
            {conversationDomain}
          </div>
        )}
        {isLoading ? (
          <ShortCopySkeletonLoader />
        ) : (
          <span className="text-md font-bold truncate max-w-full">
            {shortAddress(displayAddress) ?? "New recipient"}
          </span>
        )}
        {isLoading ? (
          <ShortCopySkeletonLoader />
        ) : (
          <span className="text-md text-gray-600 line-clamp-1 max-w-[90%] break-all mt-1">
            {text ?? "New message"}
          </span>
        )}
      </div>
      {isLoading ? (
        <IconSkeletonLoader />
      ) : (
        <div className="text-xs text-gray-600 w-1/4 text-right ml-4 h-full p-1">
          {datetime && `${formatDistanceToNowStrict(datetime)} ago`}
        </div>
      )}
    </div>
  );
};

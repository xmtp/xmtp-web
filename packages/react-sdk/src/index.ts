// context
export { XMTPProvider } from "./contexts/XMTPContext";

// helpers
export { isValidAddress } from "./helpers/isValidAddress";

// hooks
export { useClient } from "./hooks/useClient";
export { useDb } from "./hooks/useDb";

// conversations
export { useConversation } from "./hooks/useConversation";
export { useConversations } from "./hooks/useConversations";
export { useStartConversation } from "./hooks/useStartConversation";
export { useStreamConversations } from "./hooks/useStreamConversations";

// messages
export { useLastMessage } from "./hooks/useLastMessage";
export { useCanMessage } from "./hooks/useCanMessage";
export { useMessages } from "./hooks/useMessages";
export { useMessage } from "./hooks/useMessage";
export { useSendMessage } from "./hooks/useSendMessage";
export { useStreamAllMessages } from "./hooks/useStreamAllMessages";
export { useStreamMessages } from "./hooks/useStreamMessages";

// reactions
export { useReactions } from "./hooks/useReactions";

// replies
export { useReply } from "./hooks/useReply";

// caching
export { getDbInstance } from "./helpers/caching/db";

// conversations
export type {
  CachedConversation,
  CachedConversationWithId,
  CachedConversationsTable,
} from "./helpers/caching/conversations";

// messages
export type {
  CachedMessage,
  CachedMessageWithId,
  CachedMessagesTable,
  ProcessUnprocessedMessagesOptions,
} from "./helpers/caching/messages";
export {
  getMessageByXmtpID,
  processUnprocessedMessages,
  toCachedMessage,
} from "./helpers/caching/messages";

// attachments
export type { CachedAttachmentsMetadata } from "./helpers/caching/contentTypes/attachment";
export {
  attachmentContentTypeConfig,
  getAttachment,
} from "./helpers/caching/contentTypes/attachment";

// reactions
export type {
  CachedReaction,
  CachedReactionsMetadata,
  CachedReactionsTable,
} from "./helpers/caching/contentTypes/reaction";
export {
  getReactionsByXmtpID,
  hasReaction,
  reactionContentTypeConfig,
} from "./helpers/caching/contentTypes/reaction";

// read receipts
export type { CachedReadReceiptMetadata } from "./helpers/caching/contentTypes/readReceipt";
export {
  readReceiptContentTypeConfig,
  hasReadReceipt,
  getReadReceipt,
} from "./helpers/caching/contentTypes/readReceipt";

// replies
export type { CachedRepliesMetadata } from "./helpers/caching/contentTypes/reply";
export {
  hasReply,
  getOriginalMessageFromReply,
  replyContentTypeConfig,
} from "./helpers/caching/contentTypes/reply";

// text
export { textContentTypeConfig } from "./helpers/caching/contentTypes/text";

export {
  Client,
  SortDirection,
  ContentTypeId,
  ContentTypeText,
  Compression,
} from "@xmtp/xmtp-js";

// re-export types from the JS SDK
export type * from "@xmtp/xmtp-js";

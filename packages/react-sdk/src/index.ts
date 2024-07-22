// context
export { XMTPProvider } from "./contexts/XMTPContext";

// helpers
export { isValidAddress } from "./helpers/isValidAddress";

// client and DB hooks
export { useClient } from "./hooks/useClient";
export { useDb } from "./hooks/useDb";

// conversations
export { useConversation } from "./hooks/useConversation";
export { useConversations } from "./hooks/useConversations";
export { useStartConversation } from "./hooks/useStartConversation";
export { useStreamConversations } from "./hooks/useStreamConversations";

export type {
  CachedConversation,
  CachedConversationsTable,
} from "./helpers/caching/conversations";
export {
  getCachedConversationByPeerAddress,
  getCachedConversationByTopic,
  getConversationByTopic,
  hasConversationTopic,
  saveConversation,
  setConversationUpdatedAt,
  toCachedConversation,
  updateConversation,
  updateConversationMetadata,
} from "./helpers/caching/conversations";

// messages
export { useLastMessage } from "./hooks/useLastMessage";
export { useCanMessage } from "./hooks/useCanMessage";
export { useMessage } from "./hooks/useMessage";
export { useMessages } from "./hooks/useMessages";
export { useSendMessage } from "./hooks/useSendMessage";
export { useResendMessage } from "./hooks/useResendMessage";
export { useStreamAllMessages } from "./hooks/useStreamAllMessages";
export { useStreamMessages } from "./hooks/useStreamMessages";

export type {
  CachedMessage,
  CachedMessagesTable,
  ProcessUnprocessedMessagesOptions,
} from "./helpers/caching/messages";
export {
  deleteMessage,
  getLastMessage,
  getMessageByXmtpID,
  saveMessage,
  toCachedMessage,
  updateMessage,
  updateMessageMetadata,
} from "./helpers/caching/messages";

// caching
export { getDbInstance, clearCache } from "./helpers/caching/db";

// consent
export { useConsent } from "./hooks/useConsent";
export { useStreamConsentList } from "./hooks/useStreamConsentList";
export type {
  CachedConsentEntry,
  CachedConsentTable,
  CachedConsentEntryMap,
} from "./helpers/caching/consent";
export {
  bulkPutConsentState,
  getCachedConsentEntry,
  getCachedConsentEntries,
  getCachedConsentEntriesMap,
  getCachedConsentState,
  loadConsentListFromCache,
  putConsentState,
} from "./helpers/caching/consent";

// attachments
export { useAttachment } from "./hooks/useAttachment";

export {
  attachmentContentTypeConfig,
  getAttachment,
} from "./helpers/caching/contentTypes/attachment";

// reactions
export { useReactions } from "./hooks/useReactions";

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

// replies
export { useReply } from "./hooks/useReply";
export { useReplies } from "./hooks/useReplies";

export {
  getReplies,
  getOriginalMessageFromReply,
  hasReply,
  replyContentTypeConfig,
} from "./helpers/caching/contentTypes/reply";

// text
export { textContentTypeConfig } from "./helpers/caching/contentTypes/text";

// caching types
export type {
  ContentTypeMetadataValue,
  ContentTypeConfiguration,
  ContentTypeMessageProcessor,
  ContentTypeMessageProcessors,
  ContentTypeMessageValidators,
  ContentTypeMetadata,
  ContentTypeMetadataValues,
} from "./helpers/caching/db";

export { Client, SortDirection, Compression } from "@xmtp/xmtp-js";

// re-export types from the JS SDK
export type * from "@xmtp/xmtp-js";

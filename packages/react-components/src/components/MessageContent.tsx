import { ContentTypeId, ContentTypeText } from "@xmtp/react-sdk";
import type { CachedMessage } from "@xmtp/react-sdk";
import {
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { AttachmentContent } from "./AttachmentContent";
import styles from "./MessageContent.module.css";

export type MessageContentProps = {
  message: CachedMessage;
  isIncoming?: boolean;
  isRepliedTo?: boolean;
};

export const MessageContent: React.FC<MessageContentProps> = ({
  message,
  isIncoming,
  isRepliedTo,
}) => {
  const contentType = ContentTypeId.fromString(message.contentType);
  let content: any;

  // text messages
  if (contentType.sameAs(ContentTypeText)) {
    if (typeof message.content === "string")
      content =
        typeof message.content === "string" ? message.content : undefined;
  }

  // attachment messages
  if (
    contentType.sameAs(ContentTypeAttachment) ||
    contentType.sameAs(ContentTypeRemoteAttachment)
  ) {
    content = <AttachmentContent message={message} />;
  }

  return (
    <div
      className={`${styles.content} ${styles[isIncoming ? "left" : "right"]} ${
        isRepliedTo ? styles.original : ""
      }`}
      data-testid="message-tile-text">
      {content ??
        message.contentFallback ??
        "This content is not supported by this client"}
    </div>
  );
};

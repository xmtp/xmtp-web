import { useCallback, useContext } from "react";
import { ContentTypeText } from "@xmtp/xmtp-js";
import type { DecodedMessage, SendOptions, ContentTypeId } from "@xmtp/xmtp-js";
import { XMTPContext } from "@/contexts/XMTPContext";
import {
  updateMessage as _updateMessage,
  processMessage as _processMessage,
  updateMessageAfterSending as _updateMessageAfterSending,
  prepareMessageForSending,
  getMessageByXmtpID as _getMessageByXmtpID,
  deleteMessage as _deleteMessage,
} from "@/helpers/caching/messages";
import type {
  CachedMessage,
  CachedMessageWithId,
} from "@/helpers/caching/messages";
import { getConversationByTopic } from "@/helpers/caching/conversations";
import type { CachedConversation } from "@/helpers/caching/conversations";
import type { RemoveLastParameter } from "@/sharedTypes";
import type { UseSendMessageOptions } from "@/hooks/useSendMessage";
import { useClient } from "@/hooks/useClient";
import { useDb } from "@/hooks/useDb";

type ProcessMessageCallback = (
  conversation: CachedConversation,
  message: CachedMessage,
) => Promise<CachedMessage>;

export type SendMessageOptions = Omit<SendOptions, "contentType"> &
  Pick<UseSendMessageOptions, "onSuccess" | "onError">;

/**
 * This hook returns
 */
export const useMessage = () => {
  const xmtpContext = useContext(XMTPContext);
  const { processors, namespaces, validators } = xmtpContext;
  const { client } = useClient();
  const { db } = useDb();

  const processMessage = useCallback<ProcessMessageCallback>(
    async (conversation, message) => {
      if (client) {
        return _processMessage({
          client,
          conversation,
          db,
          message,
          namespaces,
          processors,
          validators,
        });
      }
      return message;
    },
    [client, db, namespaces, processors, validators],
  );

  const updateMessage = useCallback<RemoveLastParameter<typeof _updateMessage>>(
    async (message, update) => {
      await _updateMessage(message, update, db);
    },
    [db],
  );

  const updateMessageAfterSending = useCallback<
    RemoveLastParameter<typeof _updateMessageAfterSending>
  >(
    async (message, sentAt, xmtpID) =>
      _updateMessageAfterSending(message, sentAt, xmtpID, db),
    [db],
  );

  const getMessageByXmtpID = useCallback<
    RemoveLastParameter<typeof _getMessageByXmtpID>
  >(async (xmtpID) => _getMessageByXmtpID(xmtpID, db), [db]);

  const deleteMessage = useCallback<RemoveLastParameter<typeof _deleteMessage>>(
    async (message) => _deleteMessage(message, db),
    [db],
  );

  /**
   * Send a message to a conversation on the XMTP network
   *
   * @param conversation - The conversation to send the message to
   * @param content - The content of the message
   * @param contentType - The content type of the message
   * @param options - Additional options for sending the message
   * @returns The sent message and the cached message
   */
  const sendMessage = useCallback(
    async (
      conversation: CachedConversation,
      content: any,
      contentType?: ContentTypeId,
      options?: SendMessageOptions,
    ) => {
      if (!client) {
        throw new Error("XMTP client is required to send a message");
      }

      const { onSuccess, onError, ...sendOptions } = options ?? {};

      const finalSendOptions = {
        ...sendOptions,
        contentType: contentType ?? ContentTypeText,
      };

      const preparedMessage = prepareMessageForSending({
        client,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        content,
        contentType: finalSendOptions.contentType.toString(),
        conversation,
      });

      const cachedMessage = await processMessage(conversation, preparedMessage);

      const networkConversation = await getConversationByTopic(
        conversation.topic,
        client,
      );

      if (!networkConversation) {
        const noConversationError = new Error(
          "Conversation not found in XMTP client, unable to send message",
        );
        onError?.(noConversationError);
        throw noConversationError;
      }

      let sentMessage: DecodedMessage | undefined;

      try {
        sentMessage = await networkConversation.send(content, finalSendOptions);
      } catch (e) {
        await updateMessage(cachedMessage, {
          hasSendError: true,
          sendOptions: finalSendOptions,
        });
        onError?.(e as Error);
        // re-throw error for upstream consumption
        throw e;
      }

      if (sentMessage) {
        onSuccess?.(sentMessage);

        // before updating, make sure the message was added to cache
        if (cachedMessage.id) {
          await updateMessageAfterSending(
            cachedMessage,
            sentMessage.sent,
            sentMessage.id,
          );
        }
      }

      return {
        cachedMessage,
        sentMessage,
      };
    },
    [client, processMessage, updateMessage, updateMessageAfterSending],
  );

  /**
   * Resend a message that's already in the cache, which is likely due to
   * a previous send error
   *
   * @param message - The cached message to resend
   * @returns The sent message, or `undefined` if there's no XMTP client
   */
  const resendMessage = useCallback(
    async (message: CachedMessageWithId) => {
      if (!message.hasSendError) {
        throw new Error(
          "Resending a message that hasn't failed to send is not allowed",
        );
      }

      if (!client) {
        throw new Error("XMTP client is required to send a message");
      }

      // find the conversation in the client
      const networkConversation = await getConversationByTopic(
        message.conversationTopic,
        client,
      );

      // can't send a message without a conversation
      if (!networkConversation) {
        const noConversationError = new Error(
          "Conversation not found in XMTP client, unable to send message",
        );
        throw noConversationError;
      }

      const sentMessage = await networkConversation.send(
        message.content,
        message.sendOptions,
      );

      // update cached message sentAt and xmtpID properties
      await updateMessageAfterSending(
        message,
        sentMessage.sent,
        sentMessage.id,
      );

      return sentMessage;
    },
    [client, updateMessageAfterSending],
  );

  return {
    deleteMessage,
    getMessageByXmtpID,
    processMessage,
    resendMessage,
    sendMessage,
  };
};

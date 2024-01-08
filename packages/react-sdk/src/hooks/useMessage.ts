import { useCallback, useContext } from "react";
import { ContentTypeText } from "@xmtp/xmtp-js";
import type { SendOptions, ContentTypeId } from "@xmtp/xmtp-js";
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
import {
  getConversationByTopic,
  setConversationUpdatedAt,
} from "@/helpers/caching/conversations";
import type { CachedConversation } from "@/helpers/caching/conversations";
import type { RemoveLastParameter } from "@/sharedTypes";
import type { UseSendMessageOptions } from "@/hooks/useSendMessage";
import { useClient } from "@/hooks/useClient";
import { useDb } from "@/hooks/useDb";

export type SendMessageOptions = Omit<SendOptions, "contentType"> &
  Pick<UseSendMessageOptions, "onSuccess" | "onError">;

/**
 * This hook is for internal use only and wraps helper functions to include
 * the client, DB instance, and other values for easier consumption.
 */
export const useMessage = () => {
  const xmtpContext = useContext(XMTPContext);
  const { processors, namespaces, validators } = xmtpContext;
  const { client } = useClient();
  const { db } = useDb();

  const processMessage = useCallback(
    async (conversation: CachedConversation, message: CachedMessage) =>
      _processMessage({
        client,
        conversation,
        db,
        message,
        namespaces,
        processors,
        validators,
      }),
    [client, db, namespaces, processors, validators],
  );

  const updateMessage = useCallback<RemoveLastParameter<typeof _updateMessage>>(
    async (message, update) => _updateMessage(message, update, db),
    [db],
  );

  const updateMessageAfterSending = useCallback<
    RemoveLastParameter<typeof _updateMessageAfterSending>
  >(
    async (message, sentAt) => _updateMessageAfterSending(message, sentAt, db),
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

      if (content === undefined) {
        throw new Error("Message content is required to send a message");
      }

      const { onSuccess, onError, ...sendOptions } = options ?? {};

      const finalSendOptions = {
        ...sendOptions,
        contentType: contentType ?? ContentTypeText,
      };

      try {
        const { message: messageToProcess, preparedMessage } =
          await prepareMessageForSending({
            client,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            content,
            conversation,
            sendOptions: finalSendOptions,
          });

        const { status, message } = await processMessage(
          conversation,
          messageToProcess,
        );

        // these are edge cases that shouldn't happen, but just in case,
        // prevent sending the message if they occur
        switch (status) {
          case "invalid":
            throw new Error("Unable to send message: content is invalid");
          case "duplicate":
            throw new Error("Unable to send message: message is a duplicate");
          // no default
        }

        // only send the message if it's been processed
        if (status === "processed") {
          try {
            const sentMessage = await preparedMessage.send();

            // update conversation's last message time
            await setConversationUpdatedAt(
              conversation.topic,
              sentMessage.sent,
              db,
            );

            onSuccess?.(sentMessage);

            // before updating, make sure the message was added to cache
            if (message.id) {
              await updateMessageAfterSending(message, sentMessage.sent);
            }

            return {
              cachedMessage: message,
              sentMessage,
            };
          } catch (e) {
            // before updating, make sure the message is in the cache
            if (message.id) {
              await updateMessage(message, {
                hasSendError: true,
                sendOptions: finalSendOptions,
              });
            }
            // re-throw error for outer catch
            throw e;
          }
        }

        return {
          cachedMessage: message,
        };
      } catch (e) {
        onError?.(e as Error);
        // re-throw error for upstream consumption
        throw e;
      }
    },
    [client, db, processMessage, updateMessage, updateMessageAfterSending],
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

      // update conversation's last message time
      await setConversationUpdatedAt(
        networkConversation.topic,
        sentMessage.sent,
        db,
      );

      // update cached message sentAt property
      await updateMessageAfterSending(message, sentMessage.sent);

      return sentMessage;
    },
    [client, db, updateMessageAfterSending],
  );

  return {
    deleteMessage,
    getMessageByXmtpID,
    processMessage,
    resendMessage,
    sendMessage,
    updateMessage,
  };
};

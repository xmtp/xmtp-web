import { it, expect, describe, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { Client } from "@xmtp/xmtp-js";
import type { PropsWithChildren } from "react";
import { ContentTypeText } from "@xmtp/content-type-text";
import { useMessage } from "@/hooks/useMessage";
import { clearCache, getDbInstance } from "@/helpers/caching/db";
import {
  toCachedConversation,
  type CachedConversation,
} from "@/helpers/caching/conversations";
import type { CachedMessage } from "@/helpers/caching/messages";
import { createRandomWallet } from "@/helpers/testing";
import { XMTPProvider } from "@/contexts/XMTPContext";
import { isValidTextContent } from "@/helpers/caching/contentTypes/text";

const prepareMessageForSendingMock = vi.hoisted(() => vi.fn());
const processMessageMock = vi.hoisted(() => vi.fn());
const updateMessageMock = vi.hoisted(() => vi.fn());
const updateMessageAfterSendingMock = vi.hoisted(() => vi.fn());
const db = getDbInstance();
const testWallet1 = createRandomWallet();
const testWallet2 = createRandomWallet();

const testWrapper =
  (client: Client): React.FC<PropsWithChildren> =>
  // eslint-disable-next-line react/display-name
  ({ children }) => <XMTPProvider client={client}>{children}</XMTPProvider>;

vi.mock("@/hooks/useDb", () => ({
  useDb: () => ({
    db,
  }),
}));

vi.mock("@/helpers/caching/messages", async () => {
  const actual = await import("@/helpers/caching/messages");

  return {
    ...actual,
    prepareMessageForSending: prepareMessageForSendingMock,
    processMessage: processMessageMock,
    updateMessage: updateMessageMock,
    updateMessageAfterSending: updateMessageAfterSendingMock,
  };
});

describe("useMessage", () => {
  beforeEach(async () => {
    await clearCache(db);
    prepareMessageForSendingMock.mockReset();
    processMessageMock.mockReset();
    updateMessageMock.mockReset();
    updateMessageAfterSendingMock.mockReset();
  });

  describe("sendMessage", () => {
    it("should throw an error if no client is available", async () => {
      const { result } = renderHook(() => useMessage());

      await act(async () => {
        await expect(
          result.current.sendMessage(
            {
              createdAt: new Date(),
              updatedAt: new Date(),
              isReady: false,
              walletAddress: testWallet1.account.address,
              topic: "testTopic",
              peerAddress: testWallet2.account.address,
            } satisfies CachedConversation,
            "testMessage",
            ContentTypeText,
          ),
        ).rejects.toThrow("XMTP client is required to send a message");
      });
    });

    it("should throw an error if message content is undefined", async () => {
      const client = await Client.create(testWallet1, { env: "local" });
      const { result } = renderHook(() => useMessage(), {
        wrapper: testWrapper(client),
      });

      await act(async () => {
        await expect(
          result.current.sendMessage(
            {
              createdAt: new Date(),
              updatedAt: new Date(),
              isReady: false,
              walletAddress: testWallet1.account.address,
              topic: "testTopic",
              peerAddress: testWallet2.account.address,
            } satisfies CachedConversation,
            undefined,
            ContentTypeText,
          ),
        ).rejects.toThrow("Message content is required to send a message");
      });
    });

    it("should throw an error if sending failed", async () => {
      const client = await Client.create(testWallet1, { env: "local" });
      await Client.create(testWallet2, { env: "local" });
      const conversation = await client.conversations.newConversation(
        testWallet2.account.address,
        undefined,
      );
      const testConversation = {
        ...toCachedConversation(conversation, testWallet1.account.address),
        id: 1,
      };
      const testError = new Error("testError");
      const sendMock = vi.fn().mockRejectedValueOnce(testError);
      const onErrorMock = vi.fn();
      const onSuccessMock = vi.fn();
      prepareMessageForSendingMock.mockImplementationOnce(() =>
        Promise.resolve({
          message: {
            id: 1,
          },
          preparedMessage: {
            send: sendMock,
          },
        }),
      );
      processMessageMock.mockImplementationOnce(() =>
        Promise.resolve({
          status: "processed",
          message: {
            id: 1,
          },
        }),
      );

      const { result } = renderHook(() => useMessage(), {
        wrapper: testWrapper(client),
      });

      await act(async () => {
        await expect(
          result.current.sendMessage(
            testConversation,
            "testMessage",
            ContentTypeText,
            {
              onSuccess: onSuccessMock,
              onError: onErrorMock,
            },
          ),
        ).rejects.toThrow("testError");
      });

      expect(onSuccessMock).not.toHaveBeenCalled();
      expect(onErrorMock).toHaveBeenCalledWith(testError);
      expect(updateMessageMock).toHaveBeenCalledWith(
        { id: 1 },
        {
          hasSendError: true,
          sendOptions: {
            contentType: ContentTypeText,
          },
        },
        db,
      );
    });

    it("should send a message", async () => {
      const client = await Client.create(testWallet1, { env: "local" });
      await Client.create(testWallet2, { env: "local" });
      const conversation = await client.conversations.newConversation(
        testWallet2.account.address,
        undefined,
      );
      const testConversation = {
        ...toCachedConversation(conversation, testWallet1.account.address),
        id: 1,
      };
      const sentAt = new Date();
      const sendMock = vi.fn().mockImplementation(() => ({
        id: 1,
        sent: sentAt,
      }));
      const onSuccessMock = vi.fn();
      prepareMessageForSendingMock.mockImplementationOnce(() =>
        Promise.resolve({
          message: {
            id: 1,
          },
          preparedMessage: {
            send: sendMock,
          },
        }),
      );
      processMessageMock.mockImplementationOnce(() =>
        Promise.resolve({
          status: "processed",
          message: {
            id: 1,
          },
        }),
      );

      const { result } = renderHook(() => useMessage(), {
        wrapper: testWrapper(client),
      });

      await act(async () => {
        const { cachedMessage, sentMessage } = await result.current.sendMessage(
          testConversation,
          "testMessage",
          ContentTypeText,
          {
            onSuccess: onSuccessMock,
          },
        );
        expect(cachedMessage).toEqual({ id: 1 });
        expect(sentMessage).toEqual({
          id: 1,
          sent: sentAt,
        });
      });

      expect(processMessageMock).toHaveBeenCalledWith({
        client,
        conversation: testConversation,
        db,
        message: {
          id: 1,
        },
        namespaces: {
          [ContentTypeText.toString()]: "text",
        },
        processors: {},
        validators: {
          [ContentTypeText.toString()]: isValidTextContent,
        },
      });

      expect(sendMock).toHaveBeenCalled();
      expect(onSuccessMock).toHaveBeenCalledWith({
        id: 1,
        sent: sentAt,
      });
      expect(updateMessageAfterSendingMock).toHaveBeenCalledWith(
        { id: 1 },
        sentAt,
        db,
      );
    });
  });

  describe("resendMessage", () => {
    it("should throw an error if the message never failed to send", async () => {
      const { result } = renderHook(() => useMessage());

      await act(async () => {
        await expect(
          result.current.resendMessage({
            id: 1,
            content: "test",
            contentType: ContentTypeText.toString(),
            hasLoadError: false,
            hasSendError: false,
            conversationTopic: "testTopic",
            isSending: false,
            senderAddress: testWallet1.account.address,
            sentAt: new Date(),
            status: "processed",
            uuid: "testUuid",
            walletAddress: testWallet1.account.address,
            xmtpID: "testXmtpId",
          } satisfies CachedMessage),
        ).rejects.toThrow(
          "Resending a message that hasn't failed to send is not allowed",
        );
      });
    });

    it("should throw an error if no client is available", async () => {
      const { result } = renderHook(() => useMessage());

      await act(async () => {
        await expect(
          result.current.resendMessage({
            id: 1,
            content: "test",
            contentType: ContentTypeText.toString(),
            hasLoadError: false,
            hasSendError: true,
            conversationTopic: "testTopic",
            isSending: false,
            senderAddress: testWallet1.account.address,
            sentAt: new Date(),
            status: "processed",
            uuid: "testUuid",
            walletAddress: testWallet1.account.address,
            xmtpID: "testXmtpId",
          } satisfies CachedMessage),
        ).rejects.toThrow("XMTP client is required to send a message");
      });
    });

    it("should throw an error if a conversation is not found", async () => {
      const client = await Client.create(testWallet1, { env: "local" });

      const { result } = renderHook(() => useMessage(), {
        wrapper: testWrapper(client),
      });

      await act(async () => {
        await expect(
          result.current.resendMessage({
            id: 1,
            content: "test",
            contentType: ContentTypeText.toString(),
            hasLoadError: false,
            hasSendError: true,
            conversationTopic: "testTopic",
            isSending: false,
            senderAddress: testWallet1.account.address,
            sentAt: new Date(),
            status: "processed",
            uuid: "testUuid",
            walletAddress: testWallet1.account.address,
            xmtpID: "testXmtpId",
          } satisfies CachedMessage),
        ).rejects.toThrow(
          "Conversation not found in XMTP client, unable to send message",
        );
      });
    });

    it("should resend a message", async () => {
      const client = await Client.create(testWallet1, { env: "local" });
      await Client.create(testWallet2, { env: "local" });
      const conversation = await client.conversations.newConversation(
        testWallet2.account.address,
        undefined,
      );
      const sentAt = new Date();

      const { result } = renderHook(() => useMessage(), {
        wrapper: testWrapper(client),
      });

      const cachedMessage = {
        id: 1,
        content: "test",
        contentType: ContentTypeText.toString(),
        hasLoadError: false,
        hasSendError: true,
        conversationTopic: conversation.topic,
        isSending: false,
        senderAddress: testWallet1.account.address,
        sentAt,
        status: "processed",
        uuid: "testUuid",
        walletAddress: testWallet1.account.address,
        xmtpID: "testXmtpId",
        sendOptions: {
          contentType: ContentTypeText,
        },
      } satisfies CachedMessage;

      await act(async () => {
        const sentMessage = await result.current.resendMessage(cachedMessage);
        expect(sentMessage.content).toEqual("test");
        expect(sentMessage.conversation.topic).toEqual(conversation.topic);
        expect(sentMessage.senderAddress).toEqual(testWallet1.account.address);

        expect(updateMessageAfterSendingMock).toHaveBeenCalledWith(
          cachedMessage,
          sentMessage.sent,
          db,
        );
      });
    });
  });
});

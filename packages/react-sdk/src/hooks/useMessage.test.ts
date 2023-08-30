import { it, expect, describe, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { ContentTypeText } from "@xmtp/xmtp-js";
import { createContext } from "react";
import { useMessage } from "@/hooks/useMessage";
import { clearCache, getDbInstance } from "@/helpers/caching/db";
import type { CachedConversation } from "@/helpers/caching/conversations";
import type { CachedMessage } from "@/helpers/caching/messages";

const useClientMock = vi.hoisted(() => vi.fn());
const prepareMessageForSendingMock = vi.hoisted(() => vi.fn());
const processMessageMock = vi.hoisted(() => vi.fn());
const updateMessageMock = vi.hoisted(() => vi.fn());
const updateMessageAfterSendingMock = vi.hoisted(() => vi.fn());
const getConversationByTopicMock = vi.hoisted(() => vi.fn());
const db = getDbInstance();
const testWalletAddress = "testAddress";
const testPeerAddress = "testPeerAddress";

vi.mock("@/contexts/XMTPContext", () => ({
  XMTPContext: createContext({
    namespaces: "namespaces",
    processors: "processors",
  }),
}));

vi.mock("@/hooks/useDb", () => ({
  useDb: () => ({
    db,
  }),
}));

vi.mock("@/hooks/useClient", () => ({
  useClient: useClientMock,
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

vi.mock("@/helpers/caching/conversations", async () => {
  const actual = await import("@/helpers/caching/conversations");

  return {
    ...actual,
    getConversationByTopic: getConversationByTopicMock,
  };
});

describe("useMessage", () => {
  beforeEach(async () => {
    await clearCache(db);
    useClientMock.mockReset();
    prepareMessageForSendingMock.mockReset();
    processMessageMock.mockReset();
    updateMessageMock.mockReset();
    updateMessageAfterSendingMock.mockReset();
    getConversationByTopicMock.mockReset();
  });

  describe("sendMessage", () => {
    it("should throw an error if no client is available", async () => {
      useClientMock.mockImplementation(() => ({
        client: undefined,
      }));

      const { result } = renderHook(() => useMessage());

      await act(async () => {
        await expect(
          result.current.sendMessage(
            {
              id: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              isReady: false,
              walletAddress: testWalletAddress,
              topic: "testTopic",
              peerAddress: testPeerAddress,
            } satisfies CachedConversation,
            "testMessage",
            ContentTypeText,
          ),
        ).rejects.toThrow("XMTP client is required to send a message");
      });
    });

    it("should throw an error if sending failed", async () => {
      useClientMock.mockImplementation(() => ({
        client: {
          address: testWalletAddress,
        },
      }));
      const testError = new Error("testError");
      const sendMock = vi.fn().mockRejectedValueOnce(testError);
      const onErrorMock = vi.fn();
      const onSuccessMock = vi.fn();
      prepareMessageForSendingMock.mockImplementationOnce(
        () => "preparedMessage",
      );
      processMessageMock.mockImplementationOnce(() => ({
        id: 1,
      }));
      getConversationByTopicMock.mockImplementationOnce(() => ({
        send: sendMock,
      }));
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        walletAddress: testWalletAddress,
        topic: "testTopic",
        peerAddress: testPeerAddress,
      } satisfies CachedConversation;

      const { result } = renderHook(() => useMessage());

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

    it("should throw an error if a conversation is not found", async () => {
      useClientMock.mockImplementation(() => ({
        client: {
          address: testWalletAddress,
        },
      }));
      const onErrorMock = vi.fn();
      const onSuccessMock = vi.fn();
      prepareMessageForSendingMock.mockImplementationOnce(
        () => "preparedMessage",
      );
      processMessageMock.mockImplementationOnce(() => ({
        id: 1,
      }));
      getConversationByTopicMock.mockImplementationOnce(() => undefined);
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        walletAddress: testWalletAddress,
        topic: "testTopic",
        peerAddress: testPeerAddress,
      } satisfies CachedConversation;

      const { result } = renderHook(() => useMessage());

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
        ).rejects.toThrow(
          "Conversation not found in XMTP client, unable to send message",
        );
      });

      expect(onSuccessMock).not.toHaveBeenCalled();
      expect(onErrorMock).toHaveBeenCalledWith(
        new Error(
          "Conversation not found in XMTP client, unable to send message",
        ),
      );
      expect(updateMessageMock).not.toHaveBeenCalled();
    });

    it("should send a message", async () => {
      useClientMock.mockImplementation(() => ({
        client: {
          address: testWalletAddress,
        },
      }));
      const sentAt = new Date();
      const sendMock = vi.fn().mockImplementation(() => ({
        id: 1,
        sent: sentAt,
      }));
      const onSuccessMock = vi.fn();
      prepareMessageForSendingMock.mockImplementationOnce(
        () => "preparedMessage",
      );
      processMessageMock.mockImplementationOnce(() => ({
        id: 1,
      }));
      getConversationByTopicMock.mockImplementationOnce(() => ({
        send: sendMock,
      }));
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        walletAddress: testWalletAddress,
        topic: "testTopic",
        peerAddress: testPeerAddress,
      } satisfies CachedConversation;

      const { result } = renderHook(() => useMessage());

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

      expect(prepareMessageForSendingMock).toHaveBeenCalledWith({
        client: {
          address: testWalletAddress,
        },
        content: "testMessage",
        contentType: ContentTypeText.toString(),
        conversation: testConversation,
      });

      expect(processMessageMock).toHaveBeenCalledWith({
        client: {
          address: testWalletAddress,
        },
        conversation: testConversation,
        db,
        message: "preparedMessage",
        namespaces: "namespaces",
        processors: "processors",
      });

      expect(getConversationByTopicMock).toHaveBeenCalledWith("testTopic", {
        address: testWalletAddress,
      });

      expect(sendMock).toHaveBeenCalledWith("testMessage", {
        contentType: {
          authorityId: "xmtp.org",
          typeId: "text",
          versionMajor: 1,
          versionMinor: 0,
        },
      });
      expect(onSuccessMock).toHaveBeenCalledWith({
        id: 1,
        sent: sentAt,
      });
      expect(updateMessageAfterSendingMock).toHaveBeenCalledWith(
        { id: 1 },
        sentAt,
        1,
        db,
      );
    });
  });

  describe("resendMessage", () => {
    it("should throw an error if the message never failed to send", async () => {
      useClientMock.mockImplementation(() => ({
        client: undefined,
      }));

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
            senderAddress: testWalletAddress,
            sentAt: new Date(),
            status: "processed",
            uuid: "testUuid",
            walletAddress: testWalletAddress,
            xmtpID: "testXmtpId",
          } satisfies CachedMessage),
        ).rejects.toThrow(
          "Resending a message that hasn't failed to send is not allowed",
        );
      });
    });

    it("should throw an error if no client is available", async () => {
      useClientMock.mockImplementation(() => ({
        client: undefined,
      }));

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
            senderAddress: testWalletAddress,
            sentAt: new Date(),
            status: "processed",
            uuid: "testUuid",
            walletAddress: testWalletAddress,
            xmtpID: "testXmtpId",
          } satisfies CachedMessage),
        ).rejects.toThrow("XMTP client is required to send a message");
      });
    });

    it("should throw an error if a conversation is not found", async () => {
      useClientMock.mockImplementation(() => ({
        client: {
          address: testWalletAddress,
        },
      }));
      getConversationByTopicMock.mockImplementationOnce(() => undefined);

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
            senderAddress: testWalletAddress,
            sentAt: new Date(),
            status: "processed",
            uuid: "testUuid",
            walletAddress: testWalletAddress,
            xmtpID: "testXmtpId",
          } satisfies CachedMessage),
        ).rejects.toThrow(
          "Conversation not found in XMTP client, unable to send message",
        );
      });
    });

    it("should resend a message", async () => {
      useClientMock.mockImplementation(() => ({
        client: {
          address: testWalletAddress,
        },
      }));
      const sentAt = new Date();
      const sendMock = vi.fn().mockImplementation(() => ({
        id: 1,
        sent: sentAt,
      }));
      getConversationByTopicMock.mockImplementationOnce(() => ({
        send: sendMock,
      }));

      const { result } = renderHook(() => useMessage());

      const cachedMessage = {
        id: 1,
        content: "test",
        contentType: ContentTypeText.toString(),
        hasLoadError: false,
        hasSendError: true,
        conversationTopic: "testTopic",
        isSending: false,
        senderAddress: testWalletAddress,
        sentAt: new Date(),
        status: "processed",
        uuid: "testUuid",
        walletAddress: testWalletAddress,
        xmtpID: "testXmtpId",
        sendOptions: {
          contentType: ContentTypeText,
        },
      } satisfies CachedMessage;

      await act(async () => {
        const sentMessage = await result.current.resendMessage(cachedMessage);
        expect(sentMessage).toEqual({
          id: 1,
          sent: sentAt,
        });
      });

      expect(sendMock).toHaveBeenCalledWith("test", {
        contentType: {
          authorityId: "xmtp.org",
          typeId: "text",
          versionMajor: 1,
          versionMinor: 0,
        },
      });
      expect(updateMessageAfterSendingMock).toHaveBeenCalledWith(
        cachedMessage,
        sentAt,
        1,
        db,
      );
    });
  });
});

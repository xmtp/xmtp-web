import { it, expect, describe, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ConversationV2 } from "@xmtp/xmtp-js";
import { ContentTypeText } from "@xmtp/xmtp-js";
import { useStartConversation } from "@/hooks/useStartConversation";
import {
  toCachedConversation,
  type CachedConversation,
} from "@/helpers/caching/conversations";
import type { CachedMessageWithId } from "@/helpers/caching/messages";

const useClientMock = vi.hoisted(() => vi.fn());
const sendMessageMock = vi.hoisted(() => vi.fn());
const saveConversationMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useClient", () => ({
  useClient: useClientMock,
}));

vi.mock("@/hooks/useMessage", async () => {
  const actual = await import("@/hooks/useMessage");
  return {
    useMessage: () => ({
      ...actual.useMessage,
      sendMessage: sendMessageMock,
    }),
  };
});

vi.mock("@/hooks/useConversation", async () => {
  const actual = await import("@/hooks/useConversation");
  return {
    ...actual,
    useConversationInternal: () => ({
      ...actual.useConversationInternal,
      saveConversation: saveConversationMock,
    }),
  };
});

describe("useStartConversation", () => {
  beforeEach(() => {
    useClientMock.mockReset();
    sendMessageMock.mockReset();
    saveConversationMock.mockReset();
  });

  it("should have an error if no client is available", async () => {
    const onErrorMock = vi.fn();
    useClientMock.mockImplementation(() => ({
      client: undefined,
    }));
    const clientError = new Error(
      "XMTP client is required to start a conversation",
    );

    const { result } = renderHook(() =>
      useStartConversation({
        onError: onErrorMock,
      }),
    );

    await act(async () => {
      const { cachedConversation, cachedMessage, conversation } =
        await result.current.startConversation("testPeerAddress", "test");
      expect(cachedConversation).toBeUndefined();
      expect(cachedMessage).toBeUndefined();
      expect(conversation).toBeUndefined();
      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(clientError);
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(clientError);
    });
  });

  it("should throw an error if newConversation fails", async () => {
    const onErrorMock = vi.fn();
    const testError = new Error("testError");
    const newConversationMock = vi.fn().mockRejectedValueOnce(testError);
    useClientMock.mockImplementation(() => ({
      client: {
        address: "testWalletAddress",
        conversations: {
          newConversation: newConversationMock,
        },
      },
    }));

    const { result } = renderHook(() =>
      useStartConversation({
        onError: onErrorMock,
      }),
    );

    await act(async () => {
      try {
        await result.current.startConversation("testPeerAddress", "test");
      } catch (e) {
        expect(e).toEqual(testError);
      } finally {
        expect(saveConversationMock).not.toHaveBeenCalled();
        expect(sendMessageMock).not.toHaveBeenCalled();
        expect(onErrorMock).toHaveBeenCalledTimes(1);
        expect(onErrorMock).toHaveBeenCalledWith(testError);
      }
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(testError);
    });
  });

  it("should throw an error if saveConversation fails", async () => {
    const onErrorMock = vi.fn();
    const testError = new Error("testError");
    const createdAt = new Date();
    const mockConversation = {
      context: undefined,
      createdAt,
      peerAddress: "testPeerAddress",
      topic: "testTopic",
      updatedAt: createdAt,
    };
    const newConversationMock = vi.fn().mockResolvedValueOnce(mockConversation);
    useClientMock.mockImplementation(() => ({
      client: {
        address: "testWalletAddress",
        conversations: {
          newConversation: newConversationMock,
        },
      },
    }));
    saveConversationMock.mockRejectedValueOnce(testError);

    const { result } = renderHook(() =>
      useStartConversation({
        onError: onErrorMock,
      }),
    );

    await act(async () => {
      try {
        await result.current.startConversation("testPeerAddress", "test");
      } catch (e) {
        expect(e).toEqual(testError);
      } finally {
        expect(saveConversationMock).toBeCalledTimes(1);
        expect(sendMessageMock).not.toHaveBeenCalled();
        expect(onErrorMock).toHaveBeenCalledTimes(1);
        expect(onErrorMock).toHaveBeenCalledWith(testError);
      }
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(testError);
    });
  });

  it("should throw an error if sendMessage fails", async () => {
    const onErrorMock = vi.fn();
    const testError = new Error("testError");
    const createdAt = new Date();
    const mockConversation = {
      context: undefined,
      createdAt,
      peerAddress: "testPeerAddress",
      topic: "testTopic",
      updatedAt: createdAt,
    };
    const newConversationMock = vi.fn().mockResolvedValueOnce(mockConversation);
    useClientMock.mockImplementation(() => ({
      client: {
        address: "testWalletAddress",
        conversations: {
          newConversation: newConversationMock,
        },
      },
    }));
    const savedConversation = {
      id: 1,
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      walletAddress: "testWalletAddress",
      topic: "testTopic",
      peerAddress: "testPeerAddress",
    } satisfies CachedConversation;
    saveConversationMock.mockResolvedValueOnce(savedConversation);
    sendMessageMock.mockRejectedValueOnce(testError);

    const { result } = renderHook(() =>
      useStartConversation({
        onError: onErrorMock,
      }),
    );

    await act(async () => {
      try {
        await result.current.startConversation("testPeerAddress", "test");
      } catch (e) {
        expect(e).toEqual(testError);
      } finally {
        expect(newConversationMock).toBeCalledTimes(1);
        expect(saveConversationMock).toBeCalledTimes(1);
        expect(onErrorMock).toHaveBeenCalledTimes(1);
        expect(onErrorMock).toHaveBeenCalledWith(testError);
      }
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(testError);
    });
  });

  it("should start a new conversation and send a message", async () => {
    const createdAt = new Date();
    const mockConversation = {
      context: undefined,
      createdAt,
      peerAddress: "testPeerAddress",
      topic: "testTopic",
      updatedAt: createdAt,
    };
    const newConversationMock = vi.fn().mockResolvedValueOnce(mockConversation);
    useClientMock.mockImplementation(() => ({
      client: {
        address: "testWalletAddress",
        conversations: {
          newConversation: newConversationMock,
        },
      },
    }));
    const savedConversation = {
      id: 1,
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      walletAddress: "testWalletAddress",
      topic: "testTopic",
      peerAddress: "testPeerAddress",
    } satisfies CachedConversation;
    const savedMessage = {
      id: 1,
      sentAt: new Date(),
      conversationTopic: "testTopic",
      content: "test",
      contentType: ContentTypeText.toString(),
      hasLoadError: false,
      hasSendError: false,
      isSending: false,
      senderAddress: "testWalletAddress",
      status: "processed",
      walletAddress: "testWalletAddress",
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessageWithId;
    saveConversationMock.mockResolvedValueOnce(savedConversation);
    sendMessageMock.mockResolvedValueOnce({
      cachedMessage: savedMessage,
    });

    const { result } = renderHook(() => useStartConversation());

    await act(async () => {
      const { cachedConversation, cachedMessage, conversation } =
        await result.current.startConversation("testPeerAddress", "test");
      expect(cachedConversation).toEqual(savedConversation);
      expect(cachedMessage).toEqual(savedMessage);
      expect(conversation).toEqual(mockConversation);
    });

    expect(newConversationMock).toHaveBeenCalledTimes(1);
    expect(newConversationMock).toHaveBeenCalledWith(
      "testPeerAddress",
      undefined,
    );
    expect(saveConversationMock).toHaveBeenCalledTimes(1);
    expect(saveConversationMock).toHaveBeenCalledWith(
      toCachedConversation(
        mockConversation as unknown as ConversationV2<string>,
        "testWalletAddress",
      ),
    );
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });
});

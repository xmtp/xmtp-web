import { it, expect, describe, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  ContentTypeAttachment,
  type Attachment,
} from "@xmtp/content-type-remote-attachment";
import { useSendMessage } from "@/hooks/useSendMessage";
import type { CachedConversation } from "@/helpers/caching/conversations";

const sendMessageMock = vi.hoisted(() => vi.fn());
const allowMock = vi.hoisted(() => vi.fn());
const consentStateMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useMessage", async () => {
  const actual = await import("@/hooks/useMessage");
  return {
    useMessage: () => ({
      ...actual.useMessage,
      sendMessage: sendMessageMock,
    }),
  };
});

vi.mock("@/hooks/useConsent", async () => {
  const actual = await import("@/hooks/useConsent");
  return {
    useConsent: () => ({
      ...actual.useConsent,
      allow: allowMock,
      consentState: consentStateMock,
    }),
  };
});

describe("useSendMessage", () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
    allowMock.mockReset();
    consentStateMock.mockReset();
  });

  it("should send a message", async () => {
    sendMessageMock.mockResolvedValueOnce({
      sentMessage: { id: 1 },
    });
    const testConversation = {
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      isReady: false,
      walletAddress: "testWalletAddress",
      topic: "testTopic",
      peerAddress: "testPeerAddress",
    } satisfies CachedConversation;

    const { result } = renderHook(() => useSendMessage());

    await act(async () => {
      const sentMessage = await result.current.sendMessage(
        testConversation,
        "test",
      );
      expect(sentMessage).toEqual({ id: 1 });
    });

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(
      testConversation,
      "test",
      undefined,
      {
        onError: undefined,
        onSuccess: undefined,
      },
    );

    expect(consentStateMock).toHaveBeenCalledTimes(1);
    expect(consentStateMock).toHaveBeenCalledWith("testPeerAddress");

    expect(allowMock).toHaveBeenCalledTimes(1);
    expect(allowMock).toHaveBeenCalledWith(["testPeerAddress"], true);
  });

  it("should send a message with a custom content type and options", async () => {
    const onErrorMock = vi.fn();
    const onSuccessMock = vi.fn();
    sendMessageMock.mockResolvedValueOnce({
      sentMessage: { id: 1 },
    });
    const testConversation = {
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      isReady: false,
      walletAddress: "testWalletAddress",
      topic: "testTopic",
      peerAddress: "testPeerAddress",
    } satisfies CachedConversation;

    const testAttachment = {
      filename: "test",
      data: new Uint8Array(),
      mimeType: "test",
    } satisfies Attachment;

    const { result } = renderHook(() =>
      useSendMessage({
        onError: onErrorMock,
        onSuccess: onSuccessMock,
      }),
    );

    await act(async () => {
      const sentMessage = await result.current.sendMessage(
        testConversation,
        testAttachment,
        ContentTypeAttachment,
      );
      expect(sentMessage).toEqual({ id: 1 });
    });

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(
      testConversation,
      testAttachment,
      ContentTypeAttachment,
      {
        onError: onErrorMock,
        onSuccess: onSuccessMock,
      },
    );
  });

  it("should have an error when sending fails", async () => {
    const testError = new Error("testError");
    sendMessageMock.mockRejectedValueOnce(testError);
    const testConversation = {
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      isReady: false,
      walletAddress: "testWalletAddress",
      topic: "testTopic",
      peerAddress: "testPeerAddress",
    } satisfies CachedConversation;

    const { result } = renderHook(() => useSendMessage());

    await act(async () => {
      try {
        await result.current.sendMessage(testConversation, "test");
      } catch (e) {
        expect(e).toEqual(testError);
      } finally {
        expect(sendMessageMock).toHaveBeenCalledTimes(1);
        expect(consentStateMock).not.toHaveBeenCalled();
        expect(allowMock).not.toHaveBeenCalled();
      }
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(testError);
    });
  });
});

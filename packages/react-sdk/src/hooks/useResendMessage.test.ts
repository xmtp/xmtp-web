import { it, expect, describe, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ContentTypeText } from "@xmtp/xmtp-js";
import { useResendMessage } from "@/hooks/useResendMessage";
import type { CachedMessageWithId } from "@/helpers/caching/messages";

const resendMessageMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useMessage", async () => {
  const actual = await import("@/hooks/useMessage");
  return {
    useMessage: () => ({
      ...actual.useMessage,
      resendMessage: resendMessageMock,
    }),
  };
});

describe("useResendMessage", () => {
  beforeEach(() => {
    resendMessageMock.mockReset();
  });

  it("should resend a previously failed message", async () => {
    resendMessageMock.mockResolvedValueOnce({ id: 1 });
    const onSuccessMock = vi.fn();

    const testMessage = {
      id: 1,
      content: "test",
      contentType: ContentTypeText.toString(),
      hasSendError: true,
      conversationTopic: "testTopic",
      isSending: false,
      senderAddress: "testSenderAddress",
      sentAt: new Date(),
      status: "processed",
      uuid: "testUuid",
      walletAddress: "testWalletAddress",
      xmtpID: "testXmtpId",
    } satisfies CachedMessageWithId;

    const { result } = renderHook(() =>
      useResendMessage({
        onSuccess: onSuccessMock,
      }),
    );

    await act(async () => {
      const sentMessage = await result.current.resendMessage(testMessage);
      expect(sentMessage).toEqual({ id: 1 });
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
      expect(onSuccessMock).toHaveBeenCalledWith(sentMessage);
    });

    expect(resendMessageMock).toHaveBeenCalledTimes(1);
    expect(resendMessageMock).toHaveBeenCalledWith(testMessage);
  });

  it("should have an error when resending fails", async () => {
    const testError = new Error("testError");
    resendMessageMock.mockRejectedValueOnce(testError);
    const onErrorMock = vi.fn();

    const testMessage = {
      id: 1,
      content: "test",
      contentType: ContentTypeText.toString(),
      hasSendError: true,
      conversationTopic: "testTopic",
      isSending: false,
      senderAddress: "testSenderAddress",
      sentAt: new Date(),
      status: "processed",
      uuid: "testUuid",
      walletAddress: "testWalletAddress",
      xmtpID: "testXmtpId",
    } satisfies CachedMessageWithId;

    const { result } = renderHook(() =>
      useResendMessage({
        onError: onErrorMock,
      }),
    );

    await act(async () => {
      try {
        await result.current.resendMessage(testMessage);
      } catch (e) {
        expect(e).toEqual(testError);
      } finally {
        expect(resendMessageMock).toHaveBeenCalledTimes(1);
        expect(onErrorMock).toHaveBeenCalledTimes(1);
        expect(onErrorMock).toHaveBeenCalledWith(testError);
      }
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(testError);
    });
  });
});

import { it, expect, describe, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Client } from "@xmtp/xmtp-js";
import type { PropsWithChildren } from "react";
import { useClient } from "@/hooks/useClient";
import { XMTPProvider } from "@/contexts/XMTPContext";
import { createRandomWallet } from "@/helpers/testing";

const processUnprocessedMessagesMock = vi.hoisted(() => vi.fn());

const TestWrapper: React.FC<PropsWithChildren & { client?: Client }> = ({
  children,
  client,
}) => <XMTPProvider client={client}>{children}</XMTPProvider>;

vi.mock("@/helpers/caching/messages", async () => {
  const actual = await import("@/helpers/caching/messages");
  return {
    ...actual,
    processUnprocessedMessages: processUnprocessedMessagesMock,
  };
});

describe("useClient", () => {
  beforeEach(() => {
    processUnprocessedMessagesMock.mockReset();
  });

  it("should disconnect an active client", async () => {
    const disconnectClientMock = vi.fn();
    const mockClient = {
      close: disconnectClientMock,
    };
    const { result } = renderHook(() => useClient(), {
      wrapper: ({ children }) => (
        <TestWrapper client={mockClient as unknown as Client}>
          {children}
        </TestWrapper>
      ),
    });

    expect(result.current.client).toBeDefined();

    await act(async () => {
      await result.current.disconnect();
    });

    expect(disconnectClientMock).toHaveBeenCalledTimes(1);
    expect(result.current.client).toBeUndefined();
  });

  it("should not initialize a client if one is already active", async () => {
    const mockClient = {
      address: "testWalletAddress",
    };
    const clientCreateSpy = vi.spyOn(Client, "create");
    const testWallet = createRandomWallet();

    const { result } = renderHook(() => useClient(), {
      wrapper: ({ children }) => (
        <TestWrapper client={mockClient as unknown as Client}>
          {children}
        </TestWrapper>
      ),
    });

    await act(async () => {
      await result.current.initialize({ signer: testWallet });
    });

    expect(clientCreateSpy).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(processUnprocessedMessagesMock).not.toHaveBeenCalled();
    });
  });

  it("should initialize a client if one is not active", async () => {
    const testWallet = createRandomWallet();
    const mockClient = {
      address: "testWalletAddress",
    } as unknown as Client;
    const clientCreateSpy = vi
      .spyOn(Client, "create")
      .mockResolvedValue(mockClient);

    const { result } = renderHook(() => useClient(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    await act(async () => {
      await result.current.initialize({ signer: testWallet });
    });

    expect(clientCreateSpy).toHaveBeenCalledWith(testWallet, {
      codecs: [],
      privateKeyOverride: undefined,
    });
    expect(result.current.client).toBe(mockClient);
    expect(result.current.signer).toBe(testWallet);

    await waitFor(() => {
      expect(processUnprocessedMessagesMock).toHaveBeenCalledTimes(1);
    });
  });

  it("should throw an error if client initialization fails", async () => {
    const testWallet = createRandomWallet();
    const testError = new Error("testError");
    vi.spyOn(Client, "create").mockRejectedValue(testError);
    const onErrorMock = vi.fn();

    const { result } = renderHook(() => useClient(onErrorMock));

    await act(async () => {
      await expect(
        result.current.initialize({ signer: testWallet }),
      ).rejects.toThrow(testError);
    });

    expect(onErrorMock).toBeCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith(testError);
    expect(result.current.client).toBeUndefined();
    expect(result.current.signer).toBeUndefined();
    expect(result.current.error).toEqual(testError);
  });

  it("should should call the onError callback if processing unprocessed messages fails", async () => {
    const testWallet = createRandomWallet();
    const testError = new Error("testError");
    const mockClient = {
      address: "testWalletAddress",
    } as unknown as Client;
    const onErrorMock = vi.fn();
    vi.spyOn(Client, "create").mockResolvedValue(mockClient);
    processUnprocessedMessagesMock.mockRejectedValue(testError);

    const { result } = renderHook(() => useClient(onErrorMock), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    await act(async () => {
      await result.current.initialize({ signer: testWallet });
    });

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(testError);
      expect(result.current.error).toBe(null);
    });
  });
});

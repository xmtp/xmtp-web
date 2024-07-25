import { it, expect, describe, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Client } from "@xmtp/xmtp-js";
import type { PropsWithChildren } from "react";
import { TextCodec } from "@xmtp/content-type-text";
import { useClient } from "@/hooks/useClient";
import { XMTPProvider } from "@/contexts/XMTPContext";
import { createRandomWallet } from "@/helpers/testing";
import { getDbInstance } from "@/helpers/caching/db";

const processUnprocessedMessagesMock = vi.hoisted(() => vi.fn());
const loadConsentListFromCacheMock = vi.hoisted(() => vi.fn());
const clientCreateSpy = vi.spyOn(Client, "create");

const TestWrapper: React.FC<PropsWithChildren & { client?: Client }> = ({
  children,
  client,
}) => <XMTPProvider client={client}>{children}</XMTPProvider>;

const db = await getDbInstance();

vi.mock("@/hooks/useDb", () => ({
  useDb: () => ({
    getInstance: () => db,
  }),
}));

vi.mock("@/helpers/caching/messages", async () => {
  const actual = await import("@/helpers/caching/messages");
  return {
    ...actual,
    processUnprocessedMessages: processUnprocessedMessagesMock,
  };
});

vi.mock("@/helpers/caching/consent", async () => {
  const actual = await import("@/helpers/caching/consent");
  return {
    ...actual,
    loadConsentListFromCache: loadConsentListFromCacheMock,
  };
});

describe("useClient", () => {
  beforeEach(() => {
    clientCreateSpy.mockClear();
    processUnprocessedMessagesMock.mockReset();
    loadConsentListFromCacheMock.mockReset();
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

  it("should initialize a client with a signer", async () => {
    const testWallet = createRandomWallet();

    const { result } = renderHook(() => useClient(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    let client: Client | undefined;

    await act(async () => {
      client = await result.current.initialize({
        signer: testWallet,
        options: { env: "local" },
      });
    });

    // expect(clientCreateSpy).toHaveBeenCalledWith(testWallet, {
    //   env: "local",
    //   codecs: [new TextCodec()],
    //   privateKeyOverride: undefined,
    // });
    expect(result.current.client).toBe(client);

    // await waitFor(() => {
    //   expect(loadConsentListFromCacheMock).toHaveBeenCalledTimes(1);
    //   expect(processUnprocessedMessagesMock).toHaveBeenCalledTimes(1);
    // });
  });

  it("should initialize a client with keys", async () => {
    const testWallet = createRandomWallet();

    const keys = await Client.getKeys(testWallet, {
      skipContactPublishing: true,
      persistConversations: false,
      env: "local",
    });

    const { result } = renderHook(() => useClient(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    let client: Client | undefined;

    await act(async () => {
      client = await result.current.initialize({
        keys,
        options: {
          env: "local",
        },
      });
    });

    expect(clientCreateSpy.mock.calls[1][0]).toBe(null);
    expect(clientCreateSpy.mock.calls[1][1]).toEqual({
      env: "local",
      codecs: [new TextCodec()],
      privateKeyOverride: keys,
    });

    expect(result.current.client).toBe(client);

    await waitFor(() => {
      expect(loadConsentListFromCacheMock).toHaveBeenCalledTimes(1);
      expect(processUnprocessedMessagesMock).toHaveBeenCalledTimes(1);
    });
  });

  it("should should call the onError callback if loading the consent list from cache fails", async () => {
    const testWallet = createRandomWallet();
    const testError = new Error("testError");
    const onErrorMock = vi.fn();
    loadConsentListFromCacheMock.mockRejectedValue(testError);

    const { result } = renderHook(() => useClient(onErrorMock), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    await act(async () => {
      await result.current.initialize({
        signer: testWallet,
        options: { env: "local" },
      });
    });

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(testError);
      expect(result.current.error).toBe(null);
    });
  });

  it("should should call the onError callback if processing unprocessed messages fails", async () => {
    const testWallet = createRandomWallet();
    const testError = new Error("testError");
    const onErrorMock = vi.fn();
    processUnprocessedMessagesMock.mockRejectedValue(testError);

    const { result } = renderHook(() => useClient(onErrorMock), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    });

    await act(async () => {
      await result.current.initialize({
        signer: testWallet,
        options: { env: "local" },
      });
    });

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(testError);
      expect(result.current.error).toBe(null);
    });
  });

  it("should throw an error if client initialization fails", async () => {
    const testWallet = createRandomWallet();
    const testError = new Error("testError");
    clientCreateSpy.mockRejectedValue(testError);
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
    expect(result.current.error).toEqual(testError);
    clientCreateSpy.mockReset();
  });
});

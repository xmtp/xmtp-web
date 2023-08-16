import { it, expect, describe, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { Client } from "@xmtp/xmtp-js";
import { useCanMessage } from "@/hooks/useCanMessage";

const useClientMock = vi.hoisted(() => vi.fn());
const canMessageMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useClient", () => ({
  useClient: useClientMock,
}));

describe("useCanMessage", () => {
  beforeEach(() => {
    useClientMock.mockReset();
    canMessageMock.mockReset();
  });

  describe("canMessage", () => {
    it("should throw an error if no client is available", async () => {
      useClientMock.mockImplementation(() => ({
        client: undefined,
      }));
      const onErrorMock = vi.fn();

      const { result } = renderHook(() => useCanMessage(onErrorMock));
      await act(async () => {
        await expect(
          result.current.canMessage("testWalletAddress"),
        ).rejects.toThrow(
          "XMTP client is required to check if an address is on the network",
        );
      });
    });

    it("should check if an address is on the network", async () => {
      useClientMock.mockImplementation(() => ({
        client: {
          canMessage: canMessageMock,
        },
      }));

      const { result } = renderHook(() => useCanMessage());

      await act(async () => {
        await result.current.canMessage("testAddress");
      });

      expect(canMessageMock).toHaveBeenCalledOnce();
      expect(canMessageMock).toHaveBeenCalledWith("testAddress");
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it("should check if multiple addresses are on the network", async () => {
      useClientMock.mockImplementation(() => ({
        client: {
          canMessage: canMessageMock,
        },
      }));

      const { result } = renderHook(() => useCanMessage());

      await act(async () => {
        await result.current.canMessage(["testAddress1", "testAddress2"]);
      });

      expect(canMessageMock).toHaveBeenCalledOnce();
      expect(canMessageMock).toHaveBeenCalledWith([
        "testAddress1",
        "testAddress2",
      ]);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it("should have an error when it rejects", async () => {
      const testError = new Error("testError");
      canMessageMock.mockRejectedValueOnce(testError);
      useClientMock.mockImplementation(() => ({
        client: {
          canMessage: canMessageMock,
        },
      }));
      const onErrorMock = vi.fn();

      const { result } = renderHook(() => useCanMessage(onErrorMock));

      await act(async () => {
        try {
          await result.current.canMessage("testAddress");
        } catch (e) {
          expect(e).toBe(testError);
        }
      });

      expect(result.current.error).toBe(testError);
      expect(onErrorMock).toHaveBeenCalledOnce();
      expect(onErrorMock).toHaveBeenCalledWith(testError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("canMessageStatic", () => {
    it("should check if an address is on the network", async () => {
      useClientMock.mockImplementation(() => ({
        client: undefined,
      }));
      const canMessageStaticSpy = vi
        .spyOn(Client, "canMessage")
        .mockImplementation((peerAddress: string | string[]) =>
          typeof peerAddress === "string"
            ? Promise.resolve([true])
            : Promise.resolve(
                Array.from({ length: peerAddress.length }).fill(
                  true,
                ) as boolean[],
              ),
        );

      const { result } = renderHook(() => useCanMessage());

      await act(async () => {
        await result.current.canMessageStatic("testAddress");
      });

      expect(canMessageStaticSpy).toHaveBeenCalledOnce();
      expect(canMessageStaticSpy).toHaveBeenCalledWith(
        "testAddress",
        undefined,
      );
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.canMessageStatic(["testAddress1", "testAddress2"]);
      });

      expect(canMessageStaticSpy).toHaveBeenCalledTimes(2);
      expect(canMessageStaticSpy).toHaveBeenLastCalledWith(
        ["testAddress1", "testAddress2"],
        undefined,
      );
    });

    it("should have an error when it rejects", async () => {
      useClientMock.mockImplementation(() => ({
        client: undefined,
      }));

      const testError = new Error("testError");

      const canMessageStaticSpy = vi
        .spyOn(Client, "canMessage")
        .mockRejectedValueOnce(testError);

      const onErrorMock = vi.fn();

      const { result } = renderHook(() => useCanMessage(onErrorMock));

      await act(async () => {
        try {
          await result.current.canMessageStatic("testAddress");
        } catch (e) {
          expect(e).toBe(testError);
        }
      });

      expect(canMessageStaticSpy).toHaveBeenCalledOnce();
      expect(canMessageStaticSpy).toHaveBeenCalledWith(
        "testAddress",
        undefined,
      );
      expect(result.current.error).toBe(testError);
      expect(onErrorMock).toHaveBeenCalledOnce();
      expect(onErrorMock).toHaveBeenCalledWith(testError);
      expect(result.current.isLoading).toBe(false);
    });
  });
});

import { it, expect, describe, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createContext } from "react";
import { Client } from "@xmtp/xmtp-js";

import { useCanMessage } from "./useCanMessage";

const canMessageMock = vi.hoisted(() => vi.fn());

vi.mock("@/contexts/XMTPContext", () => ({
  XMTPContext: createContext({
    canMessage: canMessageMock,
  }),
}));

describe("useCanMessage", () => {
  describe("canMessage", () => {
    beforeEach(() => {
      canMessageMock.mockReset();
    });

    it("should check if an address is on the network", async () => {
      const { result } = renderHook(() => useCanMessage());

      await act(async () => {
        await result.current.canMessage("testAddress");
      });

      expect(canMessageMock).toHaveBeenCalledOnce();
      expect(canMessageMock).toHaveBeenCalledWith("testAddress");
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it("should have an error when it rejects", async () => {
      const onErrorMock = vi.fn();

      const { result } = renderHook(() => useCanMessage(onErrorMock));

      const testError = new Error("test error");

      canMessageMock.mockRejectedValueOnce(testError);

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
      const spy = vi
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

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith("testAddress", undefined);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.canMessageStatic(["testAddress1", "testAddress2"]);
      });

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(
        ["testAddress1", "testAddress2"],
        undefined,
      );
    });

    it("should have an error when it rejects", async () => {
      const onErrorMock = vi.fn();

      const { result } = renderHook(() => useCanMessage(onErrorMock));

      const testError = new Error("test error");

      const spy = vi
        .spyOn(Client, "canMessage")
        .mockImplementation(() => Promise.reject(testError));

      await act(async () => {
        try {
          await result.current.canMessageStatic("testAddress");
        } catch (e) {
          expect(e).toBe(testError);
        }
      });

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith("testAddress", undefined);
      expect(result.current.error).toBe(testError);
      expect(onErrorMock).toHaveBeenCalledOnce();
      expect(onErrorMock).toHaveBeenCalledWith(testError);
      expect(result.current.isLoading).toBe(false);
    });
  });
});

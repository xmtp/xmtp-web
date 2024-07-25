import { it, expect, describe, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useConversations } from "@/hooks/useConversations";
import { XMTPProvider } from "@/contexts/XMTPContext";

describe("useConversations", () => {
  it("should have an error when the client is undefined", () => {
    const onErrorMock = vi.fn();

    const { result } = renderHook(
      () => useConversations({ onError: onErrorMock }),
      {
        wrapper: ({ children }) => <XMTPProvider>{children}</XMTPProvider>,
      },
    );

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toEqual(
      new Error("XMTP client is required to fetch conversations"),
    );
    expect(result.current.conversations).toEqual([]);
  });
});

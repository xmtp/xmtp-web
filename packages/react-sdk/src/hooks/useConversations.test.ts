import { it, expect, describe, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import { useConversations } from "@/hooks/useConversations";

const useClientMock = vi.hoisted(() => vi.fn());
const db = getDbInstance();

vi.mock("@/hooks/useDb", () => ({
  useDb: () => ({
    db,
  }),
}));

vi.mock("@/hooks/useClient", () => ({
  useClient: useClientMock,
}));

describe("useConversations", () => {
  beforeEach(async () => {
    await clearCache(db);
    useClientMock.mockReset();
  });

  it("should have an error when the client is undefined", async () => {
    useClientMock.mockImplementation(() => ({
      client: undefined,
    }));
    const onErrorMock = vi.fn();

    const { result } = renderHook(() =>
      useConversations({ onError: onErrorMock }),
    );

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(result.current.error).toEqual(
        new Error("XMTP client is required to fetch conversations"),
      );
      expect(result.current.conversations).toEqual([]);
    });
  });
});

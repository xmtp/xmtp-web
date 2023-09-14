import { it, expect, describe, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import type { CachedConversation } from "@/helpers/caching/conversations";
import { saveConversation } from "@/helpers/caching/conversations";

const db = getDbInstance();
const testWalletAddress = "testAddress";
const testPeerAddress = "testPeerAddress";

vi.mock("./useDb", () => ({
  useDb: () => ({
    db,
  }),
}));

vi.mock("./useClient", () => ({
  useClient: () => ({
    client: {
      address: testWalletAddress,
    },
  }),
}));

// this import must be after the mocks
// eslint-disable-next-line import/first
import { useCachedConversations } from "./useCachedConversations";

describe("useCachedConversations", () => {
  beforeEach(async () => {
    await clearCache(db);
  });

  it("should return no conversations when the cache is empty", async () => {
    const { result } = renderHook(() => useCachedConversations());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it("should return conversations when they're added to the cache", async () => {
    const testConversation = {
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      isReady: false,
      walletAddress: testWalletAddress,
      topic: "testTopic",
      peerAddress: testPeerAddress,
    } satisfies CachedConversation;

    await saveConversation(testConversation, db);

    const { result } = renderHook(() => useCachedConversations());

    await waitFor(() => {
      expect(result.current.length).toBe(1);
      expect(result.current[0]).toEqual({
        ...testConversation,
        peerAddress: testPeerAddress.toLowerCase(),
        walletAddress: testWalletAddress.toLowerCase(),
      });
    });
  });
});

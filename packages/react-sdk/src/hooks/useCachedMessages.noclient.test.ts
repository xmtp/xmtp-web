import { it, expect, describe, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { getDbInstance, clearCache } from "@/helpers/caching/db";

const db = await getDbInstance();
const testTopic = "testTopic";

vi.mock("./useDb", () => ({
  useDb: () => ({
    getInstance: () => db,
  }),
}));

vi.mock("./useClient", () => ({
  useClient: () => ({
    client: undefined,
  }),
}));

// this import must be after the mocks
// eslint-disable-next-line import/first
import { useCachedMessages } from "./useCachedMessages";

describe("useCachedMessages (no client)", () => {
  beforeEach(async () => {
    await clearCache(db);
  });

  it("should return no messages when the client is undefined", async () => {
    const { result } = renderHook(() => useCachedMessages(testTopic));

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });
});

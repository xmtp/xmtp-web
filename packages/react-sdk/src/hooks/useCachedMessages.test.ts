import { it, expect, describe, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ContentTypeText } from "@xmtp/content-type-text";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import type { CachedMessage } from "@/helpers/caching/messages";
import { saveMessage } from "@/helpers/caching/messages";

// this import must be after the mocks
// eslint-disable-next-line import/first
import { useCachedMessages } from "./useCachedMessages";

const db = await getDbInstance();
const testWalletAddress = "testAddress";
const testTopic = "testTopic";

vi.mock("./useDb", () => ({
  useDb: () => ({
    getDbInstance: () => db,
  }),
}));

vi.mock("./useClient", () => ({
  useClient: () => ({
    client: {
      address: testWalletAddress,
    },
  }),
}));

describe("useCachedMessages", () => {
  beforeEach(async () => {
    await clearCache(db);
  });

  it("should return no messages when the cache is empty", async () => {
    const { result } = renderHook(() => useCachedMessages(testTopic));

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it("should return messages when they're added to the cache", async () => {
    const testMessage = {
      walletAddress: testWalletAddress,
      conversationTopic: testTopic,
      content: "test",
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasLoadError: false,
      hasSendError: false,
      sentAt: new Date(),
      status: "processed",
      senderAddress: testWalletAddress,
      uuid: "testUuid",
      id: "testXmtpId",
    } satisfies CachedMessage;

    await saveMessage(testMessage, db);

    const { result } = renderHook(() => useCachedMessages(testTopic));

    await waitFor(() => {
      expect(result.current.length).toBe(1);
      expect(result.current[0]).toEqual(testMessage);
    });
  });
});

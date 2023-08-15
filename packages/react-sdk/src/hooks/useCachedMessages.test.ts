import { it, expect, describe, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ContentTypeText } from "@xmtp/xmtp-js";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import type { CachedMessage } from "@/helpers/caching/messages";
import { saveMessage } from "@/helpers/caching/messages";

const db = getDbInstance();
const testWalletAddress = "testAddress";
const testTopic = "testTopic";

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
import { useCachedMessages } from "./useCachedMessages";

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
      id: 1,
      walletAddress: testWalletAddress,
      conversationTopic: testTopic,
      content: "test",
      contentType: ContentTypeText.toString(),
      isSending: false,
      hasSendError: false,
      sentAt: new Date(),
      status: "processed",
      senderAddress: testWalletAddress,
      uuid: "testUuid",
      xmtpID: "testXmtpId",
    } satisfies CachedMessage;

    await saveMessage({ db, message: testMessage });

    const { result } = renderHook(() => useCachedMessages(testTopic));

    await waitFor(() => {
      expect(result.current.length).toBe(1);
      expect(result.current[0]).toEqual(testMessage);
    });
  });
});

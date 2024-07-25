import { it, expect, describe, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { Client } from "@xmtp/xmtp-js";
import type { PropsWithChildren } from "react";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import { XMTPProvider } from "@/contexts/XMTPContext";
import { createRandomWallet } from "@/helpers/testing";
import {
  getCachedConsentEntries,
  getCachedConsentState,
} from "@/helpers/caching/consent";

// this import must be after the mocks
// eslint-disable-next-line import/first
import { useConsent } from "./useConsent";

const db = await getDbInstance();
const testWallet1 = createRandomWallet();
const testWallet2 = createRandomWallet();
const testWallet3 = createRandomWallet();
const testWallet4 = createRandomWallet();

const testWrapper =
  (client: Client): React.FC<PropsWithChildren> =>
  // eslint-disable-next-line react/display-name
  ({ children }) => <XMTPProvider client={client}>{children}</XMTPProvider>;

vi.mock("@/hooks/useDb", () => ({
  useDb: () => ({
    getInstance: () => db,
  }),
}));

describe("useConsent", () => {
  beforeEach(async () => {
    await clearCache(db);
  });

  it("should allow addresses", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    const allowSpy = vi
      .spyOn(client.contacts, "allow")
      .mockImplementationOnce(() => Promise.resolve());
    await Client.create(testWallet2, { env: "local" });
    const { result } = renderHook(() => useConsent(), {
      wrapper: testWrapper(client),
    });

    await act(async () => {
      await result.current.allow([testWallet2.account.address]);
      expect(allowSpy).toHaveBeenCalledWith([testWallet2.account.address]);
      const state = await getCachedConsentState(
        testWallet1.account.address,
        "address",
        testWallet2.account.address,
        db,
      );
      expect(state).toBe("allowed");
    });
  });

  it("should deny addresses", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    const allowSpy = vi
      .spyOn(client.contacts, "deny")
      .mockImplementationOnce(() => Promise.resolve());
    await Client.create(testWallet2, { env: "local" });
    const { result } = renderHook(() => useConsent(), {
      wrapper: testWrapper(client),
    });

    await act(async () => {
      await result.current.deny([testWallet2.account.address]);
      expect(allowSpy).toHaveBeenCalledWith([testWallet2.account.address]);
      const state = await getCachedConsentState(
        testWallet1.account.address,
        "address",
        testWallet2.account.address,
        db,
      );
      expect(state).toBe("denied");
    });
  });

  it("should load the consent list", async () => {
    const client = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });
    const { result } = renderHook(() => useConsent(), {
      wrapper: testWrapper(client),
    });

    await act(async () => {
      const list = await result.current.loadConsentList();
      expect(list).toEqual([]);
      await result.current.allow([testWallet2.account.address]);
      const list2 = await result.current.loadConsentList();
      expect(list2.length).toEqual(1);
      expect(list2[0].entryType).toEqual("address");
      expect(list2[0].permissionType).toEqual("allowed");
      expect(list2[0].value).toEqual(testWallet2.account.address);
      const entries = await getCachedConsentEntries(
        testWallet1.account.address,
        db,
      );
      expect(Object.keys(entries).length).toEqual(1);
      expect(entries[0].entryType).toEqual("address");
      expect(entries[0].permissionType).toEqual("allowed");
      expect(entries[0].value).toEqual(testWallet2.account.address);
    });
  });

  it("should refresh the consent list", async () => {
    const client = await Client.create(testWallet3, { env: "local" });
    await Client.create(testWallet4, { env: "local" });
    const { result } = renderHook(() => useConsent(), {
      wrapper: testWrapper(client),
    });

    await act(async () => {
      const list = await result.current.refreshConsentList();
      expect(list).toEqual([]);
      await result.current.allow([testWallet4.account.address]);
      const list2 = await result.current.refreshConsentList();
      expect(list2.length).toEqual(1);
      expect(list2[0].entryType).toEqual("address");
      expect(list2[0].permissionType).toEqual("allowed");
      expect(list2[0].value).toEqual(testWallet4.account.address);
      const entries = await getCachedConsentEntries(
        testWallet3.account.address,
        db,
      );
      expect(Object.keys(entries).length).toEqual(1);
      expect(entries[0].entryType).toEqual("address");
      expect(entries[0].permissionType).toEqual("allowed");
      expect(entries[0].value).toEqual(testWallet4.account.address);
    });
  });
});

import { it, expect, describe, beforeEach } from "vitest";
import { Client } from "@xmtp/xmtp-js";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import { createRandomWallet } from "@/helpers/testing";
import {
  bulkPutConsentState,
  getCachedConsentEntries,
  getCachedConsentEntry,
  getCachedConsentState,
  loadConsentListFromCache,
  putConsentState,
} from "@/helpers/caching/consent";

const testWallet1 = createRandomWallet();
const testWallet2 = createRandomWallet();

const db = getDbInstance();

beforeEach(async () => {
  await clearCache(db);
});

describe("Consent helpers", () => {
  describe("putConsentState", () => {
    it("should add a new entry and update it", async () => {
      const undefinedEntry = await getCachedConsentEntry(
        testWallet1.account.address,
        testWallet2.account.address,
        db,
      );
      expect(undefinedEntry).toBeUndefined();
      await putConsentState(
        testWallet1.account.address,
        testWallet2.account.address,
        "allowed",
        db,
      );
      const entry = await getCachedConsentEntry(
        testWallet1.account.address,
        testWallet2.account.address,
        db,
      );
      expect(entry).toEqual({
        peerAddress: testWallet2.account.address,
        state: "allowed",
        walletAddress: testWallet1.account.address,
      });
      const state = await getCachedConsentState(
        testWallet1.account.address,
        testWallet2.account.address,
        db,
      );
      expect(state).toBe("allowed");
      await putConsentState(
        testWallet1.account.address,
        testWallet2.account.address,
        "denied",
        db,
      );
      const updatedEntry = await getCachedConsentEntry(
        testWallet1.account.address,
        testWallet2.account.address,
        db,
      );
      expect(updatedEntry).toEqual({
        peerAddress: testWallet2.account.address,
        state: "denied",
        walletAddress: testWallet1.account.address,
      });
      const updatedState = await getCachedConsentState(
        testWallet1.account.address,
        testWallet2.account.address,
        db,
      );
      expect(updatedState).toBe("denied");
    });
  });

  describe("bulkPutConsentState", () => {
    it("should add multiple new entries", async () => {
      await bulkPutConsentState(
        [
          {
            peerAddress: testWallet2.account.address,
            state: "allowed",
            walletAddress: testWallet1.account.address,
          },
          {
            peerAddress: testWallet1.account.address,
            state: "denied",
            walletAddress: testWallet2.account.address,
          },
        ],
        db,
      );

      const entries = await getCachedConsentEntries(
        testWallet1.account.address,
        db,
      );
      expect(entries[testWallet2.account.address]?.entryType).toBe("address");
      expect(entries[testWallet2.account.address]?.value).toBe(
        testWallet2.account.address,
      );
      expect(entries[testWallet2.account.address]?.permissionType).toBe(
        "allowed",
      );

      const entries2 = await getCachedConsentEntries(
        testWallet2.account.address,
        db,
      );
      expect(entries2[testWallet1.account.address]?.entryType).toBe("address");
      expect(entries2[testWallet1.account.address]?.value).toBe(
        testWallet1.account.address,
      );
      expect(entries2[testWallet1.account.address]?.permissionType).toBe(
        "denied",
      );
    });
  });

  describe("loadConsentListFromCache", () => {
    it("should load consent list entries from the cache", async () => {
      const testClient = await Client.create(testWallet1, { env: "local" });
      await putConsentState(
        testWallet1.account.address,
        testWallet2.account.address,
        "denied",
        db,
      );
      await loadConsentListFromCache(testClient, db);
      expect(testClient.contacts.isDenied(testWallet2.account.address)).toBe(
        true,
      );
    });
  });
});

import { it, expect, describe, beforeEach } from "vitest";
import { Client } from "@xmtp/xmtp-js";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import { createRandomWallet } from "@/helpers/testing";
import {
  bulkPutConsentState,
  getCachedConsentEntries,
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
      const undefinedEntry = await getCachedConsentState(
        testWallet1.account.address,
        db,
      );
      expect(undefinedEntry).toBeUndefined();
      await putConsentState(testWallet1.account.address, "allowed", db);
      const entry = await getCachedConsentState(
        testWallet1.account.address,
        db,
      );
      expect(entry).toEqual({
        peerAddress: testWallet1.account.address,
        state: "allowed",
      });
      await putConsentState(testWallet1.account.address, "denied", db);
      const updatedEntry = await getCachedConsentState(
        testWallet1.account.address,
        db,
      );
      expect(updatedEntry).toEqual({
        peerAddress: testWallet1.account.address,
        state: "denied",
      });
    });
  });

  describe("bulkPutConsentState", () => {
    it("should add multiple new entries", async () => {
      await bulkPutConsentState(
        [
          {
            peerAddress: testWallet1.account.address,
            state: "allowed",
          },
          {
            peerAddress: testWallet2.account.address,
            state: "denied",
          },
        ],
        db,
      );
      const entries = await getCachedConsentEntries(db);

      entries.forEach((entry) => {
        expect(entry.entryType).toBe("address");
        expect(entry.permissionType).toBe(
          entry.value === testWallet1.account.address ? "allowed" : "denied",
        );
      });
    });
  });

  describe("loadConsentListFromCache", () => {
    it("should load consent list entries from the cache", async () => {
      const testClient = await Client.create(testWallet1, { env: "local" });
      await putConsentState(testWallet2.account.address, "denied", db);
      await loadConsentListFromCache(testClient, db);
      expect(testClient.contacts.isDenied(testWallet2.account.address)).toBe(
        true,
      );
    });
  });
});

import { useCallback } from "react";
import { useClient } from "@/hooks/useClient";
import { useDb } from "@/hooks/useDb";
import {
  bulkPutConsentState,
  getCachedConsentState,
} from "@/helpers/caching/consent";
import { useCachedConsentEntries } from "@/hooks/useCachedConsentEntries";

/**
 * This hook returns helper functions for working with consent
 */
export const useConsent = () => {
  const { client } = useClient();
  const { getDbInstance } = useDb();
  const entries = useCachedConsentEntries();

  const allow = useCallback(
    async (addresses: string[], skipPublish: boolean = false) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      if (!skipPublish) {
        await client.contacts.allow(addresses);
      }
      const db = await getDbInstance();
      // update DB
      await bulkPutConsentState(
        addresses.map((peerAddress) => ({
          value: peerAddress,
          type: "address",
          state: "allowed",
          walletAddress: client.address,
        })),
        db,
      );
    },
    [client, getDbInstance],
  );

  const deny = useCallback(
    async (addresses: string[], skipPublish: boolean = false) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      if (!skipPublish) {
        await client.contacts.deny(addresses);
      }
      const db = await getDbInstance();
      // update DB
      await bulkPutConsentState(
        addresses.map((peerAddress) => ({
          value: peerAddress,
          type: "address",
          state: "denied",
          walletAddress: client.address,
        })),
        db,
      );
    },
    [client, getDbInstance],
  );

  const consentState = useCallback(
    async (address: string) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      const db = await getDbInstance();
      return getCachedConsentState(client.address, "address", address, db);
    },
    [client, getDbInstance],
  );

  const isAllowed = useCallback(
    async (address: string) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      const db = await getDbInstance();
      const state = await getCachedConsentState(
        client.address,
        "address",
        address,
        db,
      );
      return state === "allowed";
    },
    [client, getDbInstance],
  );

  const isDenied = useCallback(
    async (address: string) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      const db = await getDbInstance();
      const state = await getCachedConsentState(
        client.address,
        "address",
        address,
        db,
      );
      return state === "denied";
    },
    [client, getDbInstance],
  );

  const loadConsentList = useCallback(
    async (startTime?: Date) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      const db = await getDbInstance();
      const newEntries = await client.contacts.loadConsentList(startTime);
      if (newEntries.length > 0) {
        // update DB
        await bulkPutConsentState(
          newEntries.map((entry) => ({
            value: entry.value,
            type: "address",
            state: entry.permissionType,
            walletAddress: client.address,
          })),
          db,
        );
      }
      return newEntries;
    },
    [client, getDbInstance],
  );

  const refreshConsentList = useCallback(async () => {
    if (!client) {
      throw new Error("XMTP client is required");
    }
    // clear consent DB table
    const db = await getDbInstance();
    await db.table("consent").clear();
    const newEntries = await client?.contacts.refreshConsentList();
    if (newEntries.length > 0) {
      // update DB
      await bulkPutConsentState(
        newEntries.map((entry) => ({
          value: entry.value,
          type: "address",
          state: entry.permissionType,
          walletAddress: client.address,
        })),
        db,
      );
    }
    return newEntries;
  }, [client, getDbInstance]);

  return {
    allow,
    consentState,
    deny,
    entries,
    isAllowed,
    isDenied,
    loadConsentList,
    refreshConsentList,
  };
};

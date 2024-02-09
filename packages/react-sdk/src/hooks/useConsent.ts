import { useCallback } from "react";
import { useClient } from "@/hooks/useClient";
import { useDb } from "@/hooks/useDb";
import {
  bulkPutConsentState,
  getCachedConsentState,
} from "@/helpers/caching/consent";

/**
 * This hook returns helper functions for working with consent
 */
export const useConsent = () => {
  const { client } = useClient();
  const { db } = useDb();

  const allow = useCallback(
    async (addresses: string[], skipPublish: boolean = false) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      if (!skipPublish) {
        await client.contacts.allow(addresses);
      }
      // update DB
      await bulkPutConsentState(
        addresses.map((peerAddress) => ({
          peerAddress,
          state: "allowed",
          walletAddress: client.address,
        })),
        db,
      );
    },
    [client, db],
  );

  const deny = useCallback(
    async (addresses: string[], skipPublish: boolean = false) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      if (!skipPublish) {
        await client.contacts.deny(addresses);
      }
      // update DB
      await bulkPutConsentState(
        addresses.map((peerAddress) => ({
          peerAddress,
          state: "denied",
          walletAddress: client.address,
        })),
        db,
      );
    },
    [client, db],
  );

  const consentState = useCallback(
    async (address: string) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      return getCachedConsentState(client.address, address, db);
    },
    [client, db],
  );

  const isAllowed = useCallback(
    async (address: string) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      const state = await getCachedConsentState(client.address, address, db);
      return state === "allowed";
    },
    [client, db],
  );

  const isDenied = useCallback(
    async (address: string) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      const state = await getCachedConsentState(client.address, address, db);
      return state === "denied";
    },
    [client, db],
  );

  const loadConsentList = useCallback(
    async (startTime?: Date) => {
      if (!client) {
        throw new Error("XMTP client is required");
      }
      const entries = await client.contacts.loadConsentList(startTime);
      if (entries) {
        // update DB
        await bulkPutConsentState(
          entries.map((entry) => ({
            peerAddress: entry.value,
            state: entry.permissionType,
            walletAddress: client.address,
          })),
          db,
        );
      }
      return entries;
    },
    [client, db],
  );

  const refreshConsentList = useCallback(async () => {
    if (!client) {
      throw new Error("XMTP client is required");
    }
    // clear consent DB table
    await db.table("consent").clear();
    const entries = await client?.contacts.refreshConsentList();
    if (entries) {
      // update DB
      await bulkPutConsentState(
        entries.map((entry) => ({
          peerAddress: entry.value,
          state: entry.permissionType,
          walletAddress: client.address,
        })),
        db,
      );
    }
    return entries;
  }, [client, db]);

  return {
    allow,
    consentState,
    deny,
    isAllowed,
    isDenied,
    loadConsentList,
    refreshConsentList,
  };
};

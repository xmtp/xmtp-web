import { useCallback } from "react";
import { useClient } from "@/hooks/useClient";
import { useDb } from "@/hooks/useDb";
import { bulkPutConsentState } from "@/helpers/caching/consent";

/**
 * This hook returns helper functions for working with consent
 */
export const useConsent = () => {
  const { client } = useClient();
  const { db } = useDb();

  const allow = useCallback(
    async (addresses: string[]) => {
      if (client?.address) {
        await client?.contacts.allow(addresses);
        // update DB
        await bulkPutConsentState(
          addresses.map((peerAddress) => ({
            peerAddress,
            state: "allowed",
            walletAddress: client.address,
          })),
          db,
        );
      }
    },
    [client?.address, client?.contacts, db],
  );

  const deny = useCallback(
    async (addresses: string[]) => {
      if (client?.address) {
        await client?.contacts.deny(addresses);
        // update DB
        await bulkPutConsentState(
          addresses.map((peerAddress) => ({
            peerAddress,
            state: "denied",
            walletAddress: client.address,
          })),
          db,
        );
      }
    },
    [client?.address, client?.contacts, db],
  );

  const loadConsentList = useCallback(
    async (startTime?: Date) => {
      if (client?.address) {
        const entries = await client?.contacts.loadConsentList(startTime);
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
        return entries ?? [];
      }
      return [];
    },
    [client?.address, client?.contacts, db],
  );

  const refreshConsentList = useCallback(async () => {
    if (client?.address) {
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
      return entries ?? [];
    }
    return [];
  }, [client?.address, client?.contacts, db]);

  return {
    allow,
    consentState: (address: string) =>
      client?.contacts.consentState(address) ?? "unknown",
    deny,
    isAllowed: (address: string) => client?.contacts.isAllowed(address),
    isDenied: (address: string) => client?.contacts.isDenied(address),
    loadConsentList,
    refreshConsentList,
  };
};

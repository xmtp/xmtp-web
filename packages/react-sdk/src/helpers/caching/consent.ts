import type { Table } from "dexie";
import type Dexie from "dexie";
import { Mutex } from "async-mutex";
import type { Client, ConsentState } from "@xmtp/xmtp-js";
import { ConsentListEntry } from "@xmtp/xmtp-js";

export type CachedConsentEntry = {
  peerAddress: string;
  state: ConsentState;
};

export type CachedConsentTable = Table<CachedConsentEntry, string>;

/**
 * Retrieve a cached consent state by peer address
 *
 * @returns The cached consent state if found, otherwise `undefined`
 */
export const getCachedConsentState = async (peerAddress: string, db: Dexie) => {
  const consentTable = db.table("consent") as CachedConsentTable;
  return consentTable.where("peerAddress").equals(peerAddress).first();
};

/**
 * Retrieve all cached consent entries
 *
 * @returns An array of ConsentListEntry instances
 */
export const getCachedConsentEntries = async (db: Dexie) => {
  const consentTable = db.table("consent") as CachedConsentTable;
  return (await consentTable.toArray()).map((entry) =>
    ConsentListEntry.fromAddress(entry.peerAddress, entry.state),
  );
};

export const loadConsentListFromCache = async (client: Client, db: Dexie) => {
  const cachedEntries = await getCachedConsentEntries(db);
  client.contacts.setConsentListEntries(cachedEntries);
};

// limit consent updates to 1 operation at a time to preserve order
const putConsentStateMutex = new Mutex();

/**
 * Add or update a peer address's consent state
 */
export const putConsentState = async (
  peerAddress: string,
  state: ConsentState,
  db: Dexie,
) =>
  putConsentStateMutex.runExclusive(async () => {
    const consentTable = db.table("consent") as CachedConsentTable;
    await consentTable.put({ peerAddress, state });
  });

/**
 * Add or update multiple peer addresses' consent state
 */
export const bulkPutConsentState = async (
  entries: CachedConsentEntry[],
  db: Dexie,
) =>
  putConsentStateMutex.runExclusive(async () => {
    const consentTable = db.table("consent") as CachedConsentTable;
    await consentTable.bulkPut(entries);
  });

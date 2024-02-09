import type { Table } from "dexie";
import type Dexie from "dexie";
import { Mutex } from "async-mutex";
import type { Client, ConsentState } from "@xmtp/xmtp-js";
import { ConsentListEntry } from "@xmtp/xmtp-js";

export type CachedConsentEntry = {
  peerAddress: string;
  state: ConsentState;
  walletAddress: string;
};

export type CachedConsentTable = Table<CachedConsentEntry, string>;

export type CachedConsentEntryMap = {
  [peerAddress: string]: ConsentListEntry;
};

/**
 * Retrieve a cached consent entry by wallet and peer address
 *
 * @returns The cached consent entry if found, otherwise `undefined`
 */
export const getCachedConsentEntry = async (
  walletAddress: string,
  peerAddress: string,
  db: Dexie,
) => {
  const consentTable = db.table("consent") as CachedConsentTable;
  return consentTable
    .where({
      walletAddress,
      peerAddress,
    })
    .first();
};

/**
 * Retrieve all cached consent entries
 *
 * @returns An array of ConsentListEntry instances
 */
export const getCachedConsentEntries = async (
  walletAddress: string,
  db: Dexie,
) => {
  const consentTable = db.table("consent") as CachedConsentTable;
  const entries = await consentTable.where({ walletAddress }).toArray();
  return entries.map((entry) =>
    ConsentListEntry.fromAddress(entry.peerAddress, entry.state),
  );
};

/**
 * Retrieve all cached consent entries as an object mapping
 *
 * @returns A map of peer addresses and their ConsentListEntry instance
 */
export const getCachedConsentEntriesMap = async (
  walletAddress: string,
  db: Dexie,
) => {
  const consentListEntries = await getCachedConsentEntries(walletAddress, db);

  if (!consentListEntries.length) {
    return {};
  }

  return Object.fromEntries(
    consentListEntries.map((entry) => [entry.value, entry]),
  ) as Partial<CachedConsentEntryMap>;
};

/**
 * Retrieve a cached consent state by wallet and peer address
 *
 * @returns The cached consent state if found, otherwise `undefined`
 */
export const getCachedConsentState = async (
  walletAddress: string,
  peerAddress: string,
  db: Dexie,
) => {
  const entry = await getCachedConsentEntry(walletAddress, peerAddress, db);
  return entry?.state ?? "unknown";
};

/**
 * Load the cached consent list entries into the XMTP client
 */
export const loadConsentListFromCache = async (client: Client, db: Dexie) => {
  const cachedEntries = await getCachedConsentEntries(client.address, db);
  client.contacts.setConsentListEntries(cachedEntries);
};

// limit consent updates to 1 operation at a time to preserve order
const putConsentStateMutex = new Mutex();

/**
 * Add or update a peer address's consent state
 */
export const putConsentState = async (
  walletAddress: string,
  peerAddress: string,
  state: ConsentState,
  db: Dexie,
) =>
  putConsentStateMutex.runExclusive(async () => {
    const consentTable = db.table("consent") as CachedConsentTable;
    await consentTable.put({ peerAddress, state, walletAddress });
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

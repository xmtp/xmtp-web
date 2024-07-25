import type { Table } from "dexie";
import type Dexie from "dexie";
import { Mutex } from "async-mutex";
import type { Client, ConsentState, ConsentListEntryType } from "@xmtp/xmtp-js";
import { ConsentListEntry } from "@xmtp/xmtp-js";

export type CachedConsentEntry = {
  type: ConsentListEntryType;
  value: string;
  state: ConsentState;
  walletAddress: string;
};

export type CachedConsentTable = Table<CachedConsentEntry, string>;

export type CachedConsentEntryMap = {
  [value: string]: ConsentListEntry;
};

/**
 * Retrieve a cached consent entry by wallet address, type, and value
 *
 * @returns The cached consent entry if found, otherwise `undefined`
 */
export const getCachedConsentEntry = async (
  walletAddress: string,
  type: ConsentListEntryType,
  value: string,
  db: Dexie,
) => {
  const consentTable = db.table("consent") as CachedConsentTable;
  return consentTable
    .where({
      walletAddress,
      type,
      value,
    })
    .first();
};

/**
 * Retrieve all cached consent entries for a given wallet address
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
    ConsentListEntry.fromAddress(entry.value, entry.state),
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
 * Retrieve a cached consent state by wallet address, type, and value
 *
 * @returns The cached consent state if found, otherwise `undefined`
 */
export const getCachedConsentState = async (
  walletAddress: string,
  type: ConsentListEntryType,
  value: string,
  db: Dexie,
) => {
  const entry = await getCachedConsentEntry(walletAddress, type, value, db);
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
 * Add or update a consent state
 */
export const putConsentState = async (
  walletAddress: string,
  type: ConsentListEntryType,
  value: string,
  state: ConsentState,
  db: Dexie,
) =>
  putConsentStateMutex.runExclusive(async () => {
    const consentTable = db.table("consent") as CachedConsentTable;
    await consentTable.put({ type, value, state, walletAddress });
  });

/**
 * Add or update multiple consent states
 */
export const bulkPutConsentState = async (
  entries: CachedConsentEntry[],
  db: Dexie,
) =>
  putConsentStateMutex.runExclusive(async () => {
    const consentTable = db.table("consent") as CachedConsentTable;
    await consentTable.bulkPut(entries);
  });

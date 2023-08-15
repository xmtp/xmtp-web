import { useState, createContext, useCallback, useMemo, useRef } from "react";
import type { ClientOptions, ContentCodec, Signer } from "@xmtp/xmtp-js";
import { Client } from "@xmtp/xmtp-js";
import Dexie from "dexie";
import type { CanMessageReturns, OnError } from "@/sharedTypes";
import type {
  CacheConfiguration,
  CachedMessageProcessors,
} from "@/helpers/caching/db";
import {
  getDbInstance,
  defaultCacheConfig,
  clearCache as _clearCache,
} from "@/helpers/caching/db";
import { processUnprocessedMessages } from "@/helpers/caching/messages";

export type InitClientArgs = {
  /**
   * Provide a XMTP PrivateKeyBundle encoded as a Uint8Array for signing
   *
   * This is required if `signer` is not specified
   */
  keys?: Uint8Array;
  /**
   * XMTP client options
   */
  options?: Partial<ClientOptions> & OnError;
  /**
   * The signer (wallet) to associate with the XMTP client
   */
  signer?: Signer | null;
};

export type XMTPContextValue = {
  /**
   * XMTP client error
   */
  error: unknown;
  /**
   * Check if a wallet address is on the XMTP network
   */
  canMessage: <T extends string | string[]>(
    peerAddress: T,
  ) => Promise<CanMessageReturns<T>>;
  /**
   * Clear all data in the local cache
   */
  clearCache: () => Promise<void>;
  /**
   * XMTP JS Client
   */
  client?: Client;
  /**
   * Disconnect the XMTP client
   */
  closeClient: () => void;
  /**
   * Local DB instance
   */
  db: Dexie;
  /**
   * Initialize the XMTP client
   */
  initClient: (arg0: InitClientArgs) => Promise<Client | undefined>;
  /**
   * Loading state when the XMTP client is busy
   */
  isLoading: boolean;
  /**
   * Namespaces for content types
   */
  namespaces: Record<string, string>;
  /**
   * Message processors for caching
   */
  processors: CachedMessageProcessors;
  /**
   * The signer (wallet) associated with the XMTP client
   */
  signer?: Signer;
};

const initialDb = new Dexie("__XMTP__");

export const XMTPContext = createContext<XMTPContextValue>({
  canMessage: () => Promise.resolve(false) as Promise<CanMessageReturns<false>>,
  clearCache: () => Promise.resolve(),
  client: undefined,
  closeClient: () => {},
  db: initialDb,
  error: null,
  initClient: () => Promise.resolve(undefined),
  isLoading: false,
  namespaces: {},
  processors: {},
});

export type XMTPProviderProps = React.PropsWithChildren & {
  /**
   * When clearing the cache, this async function will be awaited if set
   *
   * If it rejects or throws, the cache will not be cleared
   */
  beforeClearCache?: () => Promise<void>;
  /**
   * An array of cache configurations to support the caching of messages
   */
  cacheConfig?: CacheConfiguration[];
  /**
   * Database version to use for the local cache
   *
   * This number should be incremented when adding support for additional
   * content types
   */
  dbVersion?: number;
};

export const XMTPProvider: React.FC<XMTPProviderProps> = ({
  beforeClearCache,
  children,
  cacheConfig,
  dbVersion,
}) => {
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [clientSigner, setClientSigner] = useState<Signer | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const initializingRef = useRef(false);

  // combine all processors into a single object
  const processors = useMemo(() => {
    const finalCacheConfig = [...defaultCacheConfig, ...(cacheConfig ?? [])];
    return {
      ...(finalCacheConfig?.reduce((result, config) => {
        const update = Object.entries(config.processors).reduce(
          (updateResult, [contentType, contentProcessors]) => ({
            ...updateResult,
            [contentType]: [
              ...(result[contentType] ?? []),
              ...contentProcessors,
            ],
          }),
          {} as CachedMessageProcessors,
        );
        return {
          ...result,
          ...update,
        };
      }, {} as CachedMessageProcessors) ?? {}),
    };
  }, [cacheConfig]);

  // combine all codecs into a single array
  const codecs = useMemo(() => {
    const finalCacheConfig = [...defaultCacheConfig, ...(cacheConfig ?? [])];
    return finalCacheConfig.reduce(
      (result, config) => [...result, ...(config.codecs ?? [])],
      [] as ContentCodec<any>[],
    );
  }, [cacheConfig]);

  // combine all namespaces into a single object
  const namespaces = useMemo(() => {
    const finalCacheConfig = [...defaultCacheConfig, ...(cacheConfig ?? [])];
    const namespaceArr: string[] = [];
    return finalCacheConfig.reduce(
      (result, config) => {
        // prevent duplicate namespaces
        if (namespaceArr.includes(config.namespace)) {
          throw new Error(
            `Duplicate namespace detected: "${config.namespace}"`,
          );
        }
        namespaceArr.push(config.namespace);
        const names = Object.entries(config.processors).reduce(
          (namespacesResult, [contentType]) => ({
            ...namespacesResult,
            [contentType]: config.namespace,
          }),
          {} as Record<string, string>,
        );
        return {
          ...result,
          ...names,
        };
      },
      {} as Record<string, string>,
    );
  }, [cacheConfig]);

  // DB instance for caching
  const db = useMemo(
    () =>
      getDbInstance({
        db: initialDb,
        cacheConfig,
        version: dbVersion,
      }),
    [dbVersion, cacheConfig],
  );

  // clear all data in the local cache
  const clearCache = useCallback(async () => {
    // await beforeClearCache if present
    if (beforeClearCache) {
      try {
        await beforeClearCache();
      } catch {
        // callback promise rejected, don't clear the data
        return;
      }
    }
    // clear all data
    await _clearCache(db);
  }, [beforeClearCache, db]);

  // initialize the XMTP client
  const initClient = useCallback(
    async ({ keys, options, signer }: InitClientArgs) => {
      // client already exists, don't re-initialize
      if (!client && signer) {
        // if the client is already initializing, don't do anything
        if (initializingRef.current) {
          return undefined;
        }

        // flag the client as initializing
        initializingRef.current = true;

        // reset error state
        setError(null);
        // reset loading state
        setIsLoading(true);

        try {
          // create a new XMTP client with the provided keys, or a wallet
          const xmtpClient = await Client.create(keys ? null : signer, {
            ...options,
            codecs: [...(options?.codecs ?? []), ...codecs],
            privateKeyOverride: keys,
          });
          setClient(xmtpClient);
          setClientSigner(signer);
          try {
            // after a client is initialized, process unprocessed messages
            await processUnprocessedMessages({
              client: xmtpClient,
              db,
              processors,
              namespaces,
            });
          } catch (e) {
            console.error(
              "An error occurred while attempting to process unprocessed messages",
              e,
            );
          }
          return xmtpClient;
        } catch (e) {
          setClient(undefined);
          setClientSigner(undefined);
          setError(e);
          options?.onError?.(e);
          // re-throw error for upstream consumption
          throw e;
        } finally {
          setIsLoading(false);
          initializingRef.current = false;
        }
      }
      return client;
    },
    [client, codecs, db, namespaces, processors],
  );

  // close the XMTP client
  const closeClient = useCallback(async () => {
    if (client) {
      await client.close();
      setClient(undefined);
      setClientSigner(undefined);
    }
  }, [client]);

  // check if the client can message an address
  const canMessage = useCallback(
    async <T extends string | string[]>(
      peerAddress: T,
    ): Promise<CanMessageReturns<T>> => {
      if (!client) {
        return typeof peerAddress === "string"
          ? (false as CanMessageReturns<T>)
          : (Array.from({ length: peerAddress.length }).fill(
              false,
            ) as CanMessageReturns<T>);
      }
      // this weirdness is required to get proper typing
      return typeof peerAddress === "string"
        ? (client.canMessage(peerAddress) as Promise<CanMessageReturns<T>>)
        : (client.canMessage(peerAddress) as Promise<CanMessageReturns<T>>);
    },
    [client],
  );

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      canMessage,
      clearCache,
      client,
      closeClient,
      db,
      error,
      initClient,
      isLoading,
      namespaces,
      processors,
      signer: clientSigner,
    }),
    [
      canMessage,
      clearCache,
      client,
      clientSigner,
      closeClient,
      db,
      error,
      initClient,
      isLoading,
      namespaces,
      processors,
    ],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

import { createContext, useMemo } from "react";
import type { ContentCodec } from "@xmtp/xmtp-js";
import Dexie from "dexie";
import type {
  CacheConfiguration,
  CachedMessageProcessors,
} from "@/helpers/caching/db";
import { getDbInstance } from "@/helpers/caching/db";
import { combineNamespaces } from "@/helpers/combineNamespaces";
import { combineMessageProcessors } from "@/helpers/combineMessageProcessors";
import { combineCodecs } from "@/helpers/combineCodecs";

export type XMTPContextValue = {
  /**
   * Content codecs used by the XMTP client
   */
  codecs: ContentCodec<any>[];
  /**
   * Local DB instance
   */
  db: Dexie;
  /**
   * Namespaces for content types
   */
  namespaces: Record<string, string>;
  /**
   * Message processors for caching
   */
  processors: CachedMessageProcessors;
};

const initialDb = new Dexie("__XMTP__");

export const XMTPContext = createContext<XMTPContextValue>({
  codecs: [],
  db: initialDb,
  namespaces: {},
  processors: {},
});

export type XMTPProviderProps = React.PropsWithChildren & {
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
  children,
  cacheConfig,
  dbVersion,
}) => {
  // combine all processors into a single object
  const processors = useMemo(
    () => combineMessageProcessors(cacheConfig ?? []),
    [cacheConfig],
  );

  // combine all codecs into a single array
  const codecs = useMemo(() => combineCodecs(cacheConfig ?? []), [cacheConfig]);

  // combine all namespaces into a single object
  const namespaces = useMemo(
    () => combineNamespaces(cacheConfig ?? []),
    [cacheConfig],
  );

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

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      codecs,
      db,
      namespaces,
      processors,
    }),
    [codecs, db, namespaces, processors],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

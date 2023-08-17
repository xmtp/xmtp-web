import { createContext, useMemo, useState } from "react";
import type { Client, ContentCodec, Signer } from "@xmtp/xmtp-js";
import Dexie from "dexie";
import type {
  CacheConfiguration,
  CachedMessageProcessors,
  CachedMessageValidators,
} from "@/helpers/caching/db";
import { getDbInstance } from "@/helpers/caching/db";
import { combineNamespaces } from "@/helpers/combineNamespaces";
import { combineMessageProcessors } from "@/helpers/combineMessageProcessors";
import { combineCodecs } from "@/helpers/combineCodecs";
import { combineValidators } from "@/helpers/combineValidators";

export type XMTPContextValue = {
  /**
   * The XMTP client instance
   */
  client?: Client;
  /**
   * Content codecs used by the XMTP client instance
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
  /**
   * Set the XMTP client instance
   */
  setClient: React.Dispatch<React.SetStateAction<Client | undefined>>;
  /**
   * Set the signer (wallet) to associate with the XMTP client instance
   */
  setClientSigner: React.Dispatch<React.SetStateAction<Signer | undefined>>;
  /**
   * The signer (wallet) associated with the XMTP client instance
   */
  signer?: Signer | null;
  /**
   * Message content validators for content types
   */
  validators: CachedMessageValidators;
};

const initialDb = new Dexie("__XMTP__");

export const XMTPContext = createContext<XMTPContextValue>({
  codecs: [],
  db: initialDb,
  namespaces: {},
  processors: {},
  setClient: () => {},
  setClientSigner: () => {},
  validators: {},
});

export type XMTPProviderProps = React.PropsWithChildren & {
  /**
   * Initial XMTP client instance
   */
  client?: Client;
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
  client: initialClient,
  cacheConfig,
  dbVersion,
}) => {
  const [client, setClient] = useState<Client | undefined>(initialClient);
  const [clientSigner, setClientSigner] = useState<Signer | undefined>(
    undefined,
  );

  // combine all message processors
  const processors = useMemo(
    () => combineMessageProcessors(cacheConfig ?? []),
    [cacheConfig],
  );

  // combine all codecs
  const codecs = useMemo(() => combineCodecs(cacheConfig ?? []), [cacheConfig]);

  // combine all namespaces
  const namespaces = useMemo(
    () => combineNamespaces(cacheConfig ?? []),
    [cacheConfig],
  );

  // combine all content validators
  const validators = useMemo(
    () => combineValidators(cacheConfig ?? []),
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
      client,
      codecs,
      db,
      namespaces,
      processors,
      setClient,
      setClientSigner,
      signer: clientSigner,
      validators,
    }),
    [client, clientSigner, codecs, db, namespaces, processors, validators],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

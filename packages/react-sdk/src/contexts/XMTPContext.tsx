import { createContext, useMemo, useRef, useState } from "react";
import type { Client } from "@xmtp/xmtp-js";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import type Dexie from "dexie";
import type {
  ContentTypeConfiguration,
  ContentTypeMessageProcessors,
  ContentTypeMessageValidators,
} from "@/helpers/caching/db";
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
   * Content type configurations used by the XMTP client instance
   */
  contentTypeConfigs?: ContentTypeConfiguration[];
  /**
   * Reference to Dexie database instance
   */
  dbRef: React.MutableRefObject<Dexie | null>;
  /**
   * Namespaces for content types
   */
  namespaces: Record<string, string>;
  /**
   * Message processors for caching
   */
  processors: ContentTypeMessageProcessors;
  /**
   * Set the XMTP client instance
   */
  setClient: React.Dispatch<React.SetStateAction<Client | undefined>>;
  /**
   * Message content validators for content types
   */
  validators: ContentTypeMessageValidators;
};

export const XMTPContext = createContext<XMTPContextValue>({
  codecs: [],
  contentTypeConfigs: [],
  dbRef: { current: null },
  namespaces: {},
  processors: {},
  setClient: () => {},
  validators: {},
});

export type XMTPProviderProps = React.PropsWithChildren & {
  /**
   * Initial XMTP client instance
   */
  client?: Client;
  /**
   * An array of content type configurations to support the caching and/or
   * processing of messages
   */
  contentTypeConfigs?: ContentTypeConfiguration[];
};

export const XMTPProvider: React.FC<XMTPProviderProps> = ({
  children,
  client: initialClient,
  contentTypeConfigs,
}) => {
  const [client, setClient] = useState<Client | undefined>(initialClient);
  const dbRef = useRef<Dexie | null>(null);

  // combine all message processors
  const processors = useMemo(
    () => combineMessageProcessors(contentTypeConfigs ?? []),
    [contentTypeConfigs],
  );

  // combine all codecs
  const codecs = useMemo(
    () => combineCodecs(contentTypeConfigs ?? []),
    [contentTypeConfigs],
  );

  // combine all namespaces
  const namespaces = useMemo(
    () => combineNamespaces(contentTypeConfigs ?? []),
    [contentTypeConfigs],
  );

  // combine all content validators
  const validators = useMemo(
    () => combineValidators(contentTypeConfigs ?? []),
    [contentTypeConfigs],
  );

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      client,
      codecs,
      contentTypeConfigs: contentTypeConfigs ?? [],
      dbRef,
      namespaces,
      processors,
      setClient,
      validators,
    }),
    [client, codecs, contentTypeConfigs, namespaces, processors, validators],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

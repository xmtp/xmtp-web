import { createContext, useMemo, useState } from "react";
import type { Client, ContentCodec, Signer } from "@xmtp/xmtp-js";
import Dexie from "dexie";
import type {
  ContentTypeConfiguration,
  ContentTypeMessageProcessors,
  ContentTypeMessageValidators,
  ConversationProcessors,
} from "@/helpers/caching/db";
import { getDbInstance } from "@/helpers/caching/db";
import { combineNamespaces } from "@/helpers/combineNamespaces";
import { combineMessageProcessors } from "@/helpers/combineMessageProcessors";
import { combineCodecs } from "@/helpers/combineCodecs";
import { combineValidators } from "@/helpers/combineValidators";
import { combineConversationProcessors } from "@/helpers/combineConversationProcessors";

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
  processors: ContentTypeMessageProcessors;
  /**
   * Conversation processors for caching
   */
  conversationProcessors: ConversationProcessors;
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
  validators: ContentTypeMessageValidators;
};

const initialDb = new Dexie("__XMTP__");

export const XMTPContext = createContext<XMTPContextValue>({
  codecs: [],
  db: initialDb,
  namespaces: {},
  processors: {},
  conversationProcessors: {},
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
   * An array of content type configurations to support the caching and/or
   * processing of messages
   */
  contentTypeConfigs?: ContentTypeConfiguration[];
  /**
   * An array of conversation configurations to support the processing of
   * conversations
   */
  conversationConfigs?: ConversationProcessors[];
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
  contentTypeConfigs,
  conversationConfigs,
  dbVersion,
}) => {
  const [client, setClient] = useState<Client | undefined>(initialClient);
  const [clientSigner, setClientSigner] = useState<Signer | undefined>(
    undefined,
  );

  // combine all message processors
  const processors = useMemo(
    () => combineMessageProcessors(contentTypeConfigs ?? []),
    [contentTypeConfigs],
  );

  // combine all conversation processors
  const conversationProcessors = useMemo(
    () => combineConversationProcessors(conversationConfigs ?? []),
    [conversationConfigs],
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

  // DB instance for caching
  const db = useMemo(
    () =>
      getDbInstance({
        db: initialDb,
        contentTypeConfigs,
        version: dbVersion,
      }),
    [dbVersion, contentTypeConfigs],
  );

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      client,
      codecs,
      db,
      namespaces,
      processors,
      conversationProcessors,
      setClient,
      setClientSigner,
      signer: clientSigner,
      validators,
    }),
    [
      client,
      clientSigner,
      codecs,
      conversationProcessors,
      db,
      namespaces,
      processors,
      validators,
    ],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

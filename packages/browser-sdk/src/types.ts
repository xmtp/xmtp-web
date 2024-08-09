import type {
  ContentCodec,
  ContentTypeId,
} from "@xmtp/content-type-primitives";
import type { ApiUrls } from "./constants";
import type { StreamCallback } from "@/helpers/AsyncStream";

export type XmtpEnv = keyof typeof ApiUrls;

export type NetworkOptions = {
  /**
   * Specify which XMTP environment to connect to. (default: `dev`)
   */
  env?: XmtpEnv;
  /**
   * apiUrl can be used to override the `env` flag and connect to a
   * specific endpoint
   */
  apiUrl?: string;
};

export type EncryptionOptions = {
  /**
   * Encryption key to use for the local DB
   */
  encryptionKey?: Uint8Array | null;
};

export type ContentOptions = {
  /**
   * Allow configuring codecs for additional content types
   */
  codecs?: ContentCodec<any>[];
};

export type ClientOptions = NetworkOptions & EncryptionOptions & ContentOptions;

export type WasmClient = {
  accountAddress: string;
  inboxId: () => string;
  installationId: () => string;
  isRegistered: () => boolean;
  signatureText: () => string;
  canMessage: (accountAddresses: string[]) => Promise<boolean>;
  addEcdsaSignature: (signatureBytes: Uint8Array) => void;
  addScwSignature: (
    signatureBytes: Uint8Array,
    chainId: string,
    accountAddress: string,
    chainRpcUrl: string,
    blockNumber: bigint,
  ) => void;
  registerIdentity: () => Promise<void>;
  requestHistorySync: () => Promise<void>;
  findInboxIdByAddress: (accountAddress: string) => Promise<string>;
};

export type WasmGroup = {
  id: () => string;
  groupName: () => string;
  updateGroupName: (name: string) => Promise<void>;
  groupImageUrlSquare: () => string;
  updateGroupImageUrlSquare: (imageUrl: string) => Promise<void>;
  groupDescription: () => string;
  updateGroupDescription: (description: string) => Promise<void>;
  groupPinnedFrameUrl: () => string;
  updateGroupPinnedFrameUrl: (pinnedFrameUrl: string) => Promise<void>;
  isActive: () => boolean;
  addedByInboxId: () => string;
  createdAtNs: () => number;
  groupMetadata: () => {
    creatorInboxId: () => string;
    conversationType: () => string;
  };
  listMembers: () => string[];
  adminList: () => string[];
  superAdminList: () => string[];
  groupPermissions: () => {
    policyType: () => string;
    policySet: () => string;
  };
  isAdmin: (inboxId: string) => boolean;
  isSuperAdmin: (inboxId: string) => boolean;
  sync: () => Promise<void>;
  stream: (callback: StreamCallback<any>) => {
    end: () => void;
  };
  sendOptimistic: (content: any) => Promise<void>;
  send: (content: any) => Promise<void>;
  findMessages: (options?: any) => any[];
  addMembers: (accountAddresses: string[]) => Promise<void>;
  addMembersByInboxId: (inboxIds: string[]) => Promise<void>;
  removeMembers: (accountAddresses: string[]) => Promise<void>;
  removeMembersByInboxId: (inboxIds: string[]) => Promise<void>;
  addAdmin: (inboxId: string) => Promise<void>;
  removeAdmin: (inboxId: string) => Promise<void>;
  addSuperAdmin: (inboxId: string) => Promise<void>;
  removeSuperAdmin: (inboxId: string) => Promise<void>;
  publishMessages: () => Promise<void>;
};

export type CreateGroupOptions = any;
export type ListMessagesOptions = any;

export type MessageKind = "application" | "membership_change";
export type MessageDeliveryStatus = "unpublished" | "published" | "failed";

export type WasmMessage = {
  id: string;
  sentAtNs: number;
  convoId: string;
  senderInboxId: string;
  kind: number;
  deliveryStatus: number;
  content: {
    type: ContentTypeId;
    parameters: Record<string, string>;
    fallback: string;
    compression: number;
  };
};

export type WasmConversations = {
  findGroupById: (id: string) => WasmGroup;
  findMessageById: (id: string) => WasmMessage;
  createGroup: (
    accountAddresses: string[],
    options?: CreateGroupOptions,
  ) => Promise<WasmGroup>;
  list: (options?: ListMessagesOptions) => Promise<WasmGroup[]>;
  sync: () => Promise<void>;
  stream: (callback: (err: Error | null, group: WasmGroup) => void) => {
    end: () => void;
  };
  streamAllMessages: (
    callback: (err: Error | null, message: WasmMessage) => void,
  ) => {
    end: () => void;
  };
};

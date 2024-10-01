import type { SafeEncodedContent } from "@/utils/conversions";
import type {
  ClientOptions,
  ListConversationsOptions,
  ListMessagesOptions,
} from "@/types/options";

export type ClientWorkerEventsData =
  | {
      action: "init";
      id: string;
      data: {
        address: string;
        options?: ClientOptions;
      };
    }
  | {
      action: "getSignatureText";
      id: string;
      data: undefined;
    }
  | {
      action: "addSignature";
      id: string;
      data: {
        bytes: Uint8Array;
      };
    }
  | {
      action: "registerIdentity";
      id: string;
      data: undefined;
    }
  | {
      action: "isRegistered";
      id: string;
      data: undefined;
    }
  | {
      action: "canMessage";
      id: string;
      data: {
        accountAddresses: string[];
      };
    }
  | {
      action: "getConversationById";
      id: string;
      data: {
        id: string;
      };
    }
  | {
      action: "getMessageById";
      id: string;
      data: {
        id: string;
      };
    }
  | {
      action: "getConversations";
      id: string;
      data: {
        options?: ListConversationsOptions;
      };
    }
  | {
      action: "newGroup";
      id: string;
      data: {
        accountAddresses: string[];
      };
    }
  | {
      action: "updateGroupName";
      id: string;
      data: {
        id: string;
        name: string;
      };
    }
  | {
      action: "updateGroupImageUrlSquare";
      id: string;
      data: {
        id: string;
        imageUrl: string;
      };
    }
  | {
      action: "updateGroupDescription";
      id: string;
      data: {
        id: string;
        description: string;
      };
    }
  | {
      action: "updateGroupPinnedFrameUrl";
      id: string;
      data: {
        id: string;
        pinnedFrameUrl: string;
      };
    }
  | {
      action: "getGroupMembers";
      id: string;
      data: {
        id: string;
      };
    }
  | {
      action: "isGroupAdmin";
      id: string;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "isGroupSuperAdmin";
      id: string;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "syncGroup";
      id: string;
      data: {
        id: string;
      };
    }
  | {
      action: "addGroupMembers";
      id: string;
      data: {
        id: string;
        accountAddresses: string[];
      };
    }
  | {
      action: "addGroupMembersByInboxId";
      id: string;
      data: {
        id: string;
        inboxIds: string[];
      };
    }
  | {
      action: "removeGroupMembers";
      id: string;
      data: {
        id: string;
        accountAddresses: string[];
      };
    }
  | {
      action: "removeGroupMembersByInboxId";
      id: string;
      data: {
        id: string;
        inboxIds: string[];
      };
    }
  | {
      action: "addGroupAdmin";
      id: string;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "addGroupSuperAdmin";
      id: string;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "removeGroupAdmin";
      id: string;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "removeGroupSuperAdmin";
      id: string;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "publishGroupMessages";
      id: string;
      data: {
        id: string;
      };
    }
  | {
      action: "sendOptimisticGroupMessage";
      id: string;
      data: {
        id: string;
        content: SafeEncodedContent;
      };
    }
  | {
      action: "sendGroupMessage";
      id: string;
      data: {
        id: string;
        content: SafeEncodedContent;
      };
    }
  | {
      action: "getGroupMessages";
      id: string;
      data: {
        id: string;
        options?: ListMessagesOptions;
      };
    };

export type ClientWorkerEvents = ClientWorkerEventsData["action"];

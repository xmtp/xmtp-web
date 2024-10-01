import type { SafeConversation, SafeMessage } from "@/utils/conversions";

export type ClientEventsData =
  | {
      action: "init";
      id: string;
      result: {
        inboxId: string;
        installationId: string;
      };
    }
  | {
      action: "getSignatureText";
      id: string;
      result: string | undefined;
    }
  | {
      action: "addSignature";
      id: string;
      result: undefined;
    }
  | {
      action: "registerIdentity";
      id: string;
      result: undefined;
    }
  | {
      action: "isRegistered";
      id: string;
      result: boolean;
    }
  | {
      action: "canMessage";
      id: string;
      result: Map<string, boolean>;
    }
  | {
      action: "getConversationById";
      id: string;
      result: SafeConversation | undefined;
    }
  | {
      action: "getMessageById";
      id: string;
      result: SafeMessage | undefined;
    }
  | {
      action: "getConversations";
      id: string;
      result: SafeConversation[];
    }
  | {
      action: "newGroup";
      id: string;
      result: SafeConversation;
    }
  | {
      action: "syncGroup";
      id: string;
      result: SafeConversation;
    }
  | {
      action: "updateGroupName";
      id: string;
      result: undefined;
    }
  | {
      action: "updateGroupDescription";
      id: string;
      result: undefined;
    }
  | {
      action: "updateGroupImageUrlSquare";
      id: string;
      result: undefined;
    }
  | {
      action: "updateGroupPinnedFrameUrl";
      id: string;
      result: undefined;
    }
  | {
      action: "sendGroupMessage";
      id: string;
      result: string;
    }
  | {
      action: "sendOptimisticGroupMessage";
      id: string;
      result: string;
    }
  | {
      action: "getGroupMessages";
      id: string;
      result: SafeMessage[];
    }
  | {
      action: "getGroupMembers";
      id: string;
      result: string[];
    }
  | {
      action: "isGroupAdmin";
      id: string;
      result: boolean;
    }
  | {
      action: "isGroupSuperAdmin";
      id: string;
      result: boolean;
    }
  | {
      action: "addGroupMembers";
      id: string;
      result: undefined;
    }
  | {
      action: "removeGroupMembers";
      id: string;
      result: undefined;
    }
  | {
      action: "addGroupMembersByInboxId";
      id: string;
      result: undefined;
    }
  | {
      action: "removeGroupMembersByInboxId";
      id: string;
      result: undefined;
    }
  | {
      action: "addGroupAdmin";
      id: string;
      result: undefined;
    }
  | {
      action: "removeGroupAdmin";
      id: string;
      result: undefined;
    }
  | {
      action: "addGroupSuperAdmin";
      id: string;
      result: undefined;
    }
  | {
      action: "removeGroupSuperAdmin";
      id: string;
      result: undefined;
    }
  | {
      action: "publishGroupMessages";
      id: string;
      result: undefined;
    };

export type ClientEvents = ClientEventsData["action"];

export type ClientEventsPostMessageData<A extends ClientEvents> = Extract<
  ClientEventsData,
  { action: A }
>;

export type ClientEventsResult<A extends ClientEvents> = Extract<
  ClientEventsData,
  { action: A }
>["result"];

export type ClientEventsErrorData = {
  id: string;
  action: ClientEvents;
  error: string;
};

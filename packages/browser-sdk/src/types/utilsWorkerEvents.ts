import type { XmtpEnv } from "@/types";

export type UtilsWorkerEventsData =
  | {
      action: "generateInboxId";
      id: string;
      data: {
        address: string;
      };
    }
  | {
      action: "getInboxIdForAddress";
      id: string;
      data: {
        address: string;
        env?: XmtpEnv;
      };
    };

export type UtilsWorkerEvents = UtilsWorkerEventsData["action"];

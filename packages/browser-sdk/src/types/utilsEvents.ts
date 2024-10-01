export type UtilsEventsData =
  | {
      action: "generateInboxId";
      id: string;
      result: string;
    }
  | {
      action: "getInboxIdForAddress";
      id: string;
      result: string | undefined;
    };

export type UtilsEvents = UtilsEventsData["action"];

export type UtilsEventsPostMessageData<A extends UtilsEvents> = Extract<
  UtilsEventsData,
  { action: A }
>;

export type UtilsEventsResult<A extends UtilsEvents> = Extract<
  UtilsEventsData,
  { action: A }
>["result"];

export type UtilsEventsErrorData = {
  id: string;
  action: UtilsEvents;
  error: string;
};

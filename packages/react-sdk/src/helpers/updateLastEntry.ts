import { SortDirection, type DecodedMessage } from "@xmtp/xmtp-js";
import { adjustDate } from "./adjustDate";

export type UpdateLastEntryOptions = {
  direction?: string;
  endTimeRef: React.MutableRefObject<Date | undefined>;
  startTimeRef: React.MutableRefObject<Date | undefined>;
  lastEntry?: DecodedMessage;
  lastEntryRef: React.MutableRefObject<DecodedMessage | undefined>;
};

/**
 * Update passed references for paging through messages
 */
export const updateLastEntry = ({
  direction,
  endTimeRef,
  startTimeRef,
  lastEntry,
  lastEntryRef,
}: UpdateLastEntryOptions) => {
  if (lastEntry) {
    // eslint-disable-next-line no-param-reassign
    lastEntryRef.current = lastEntry;
    if (direction === SortDirection.SORT_DIRECTION_DESCENDING) {
      // eslint-disable-next-line no-param-reassign
      endTimeRef.current = adjustDate(lastEntry.sent, -1);
    } else {
      // eslint-disable-next-line no-param-reassign
      startTimeRef.current = adjustDate(lastEntry.sent, 1);
    }
  }
};

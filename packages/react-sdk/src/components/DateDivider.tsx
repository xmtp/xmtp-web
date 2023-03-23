import { format } from "date-fns";

export type DateDividerProps = {
  /**
   * What date should be displayed in the divider?
   */
  date: Date;
};

export const DateDivider: React.FC<DateDividerProps> = ({ date }) => (
  <div className="flex align-items-center items-center pb-8 pt-4">
    <div className="grow h-0.5 bg-gray-300/25" />
    <span className="mx-2 flex-none text-gray-500 text-sm font-bold">
      {format(date, "PPP")}
    </span>
    <div className="grow h-0.5 bg-gray-300/25" />
  </div>
);

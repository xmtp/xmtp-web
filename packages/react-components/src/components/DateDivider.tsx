import { format } from "date-fns";
import styles from "./DateDivider.module.css";

export type DateDividerProps = {
  /**
   * What date should be displayed in the divider?
   */
  date: Date;
};

export const DateDivider: React.FC<DateDividerProps> = ({ date }) => (
  <div className={styles.wrapper}>
    <div className={styles.date}>{format(date, "PPP")}</div>
  </div>
);

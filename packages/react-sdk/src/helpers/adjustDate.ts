/**
 * Adjust the date by the given amount of milliseconds
 *
 * @param date The data to adjust
 * @param change The change in milliseconds to apply to the date
 * @returns The new adjusted date
 */
export const adjustDate = (date: Date, change: number) => {
  const newDate = new Date(date);
  newDate.setMilliseconds(date.getMilliseconds() + change);
  return newDate;
};

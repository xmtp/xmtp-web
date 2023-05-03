export const adjustDate = (date: Date, change: number) => {
  const newDate = new Date(date);
  newDate.setMilliseconds(date.getMilliseconds() + change);
  return newDate;
};

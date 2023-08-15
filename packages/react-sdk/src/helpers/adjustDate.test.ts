import { it, expect, describe } from "vitest";
import { adjustDate } from "@/helpers/adjustDate";

describe("adjustDate", () => {
  it("should should increase the date by the given amount of milliseconds", () => {
    const date = new Date();
    const newDate = adjustDate(date, 1000);
    expect(newDate.getTime()).toBe(date.getTime() + 1000);
  });

  it("should should decrease the date by the given amount of milliseconds", () => {
    const date = new Date();
    const newDate = adjustDate(date, -1000);
    expect(newDate.getTime()).toBe(date.getTime() - 1000);
  });
});

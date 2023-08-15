import { it, expect, describe } from "vitest";
import { isValidAddress } from "@/helpers/isValidAddress";

describe("isValidAddress", () => {
  it("should return true for a valid address", () => {
    expect(isValidAddress("0x1234567890123456789012345678901234567890")).toBe(
      true,
    );
  });

  it("should return false for an invalid address", () => {
    expect(isValidAddress("0x123456789012345")).toBe(false);
    expect(isValidAddress("123456789012345678901234567890123456789012")).toBe(
      false,
    );
  });
});

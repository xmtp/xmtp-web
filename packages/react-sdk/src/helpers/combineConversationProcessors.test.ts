import { it, expect, describe, vi } from "vitest";
import { combineConversationProcessors } from "@/helpers/combineConversationProcessors";
import type { ConversationProcessors } from "@/helpers/caching/db";

const process1 = vi.fn();
const process2 = vi.fn();
const process3 = vi.fn();

const config1 = {
  foo: [process1],
};

const config2 = {
  foo: [process2],
};

const config3 = {
  bar: [process3],
};

const testConfig = [
  config1,
  config2,
  config3,
] satisfies ConversationProcessors[];

describe("combineConversationProcessors", () => {
  it("should combine conversation processors from a config", () => {
    expect(combineConversationProcessors(testConfig)).toEqual({
      foo: [process1, process2],
      bar: [process3],
    });
  });

  it("should have no conversation processors if passed empty array", () => {
    expect(combineConversationProcessors([])).toEqual({});
  });
});

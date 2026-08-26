import { describe, expect, it } from "vitest";
import { shared } from "./shared";

const counted = (value: string) => {
  let calls = 0;

  return {
    calls: () => calls,
    load: async () => {
      calls += 1;

      return value;
    },
  };
};

describe("shared", () => {
  it("should go upstream again once the answer is stale", async () => {
    // given nothing may be held as fresh
    const upstream = counted("stale");

    // when two callers ask one after the other
    await shared("test:stale", 0, upstream.load);
    await shared("test:stale", 0, upstream.load);

    // then each had to fetch, because neither found a fresh answer
    expect(upstream.calls()).toBe(2);
  });

  it("should make one upstream call for callers that arrive together", async () => {
    // given three consumers wanting the same product in the same tick
    const upstream = counted("once");

    // when
    const answers = await Promise.all([
      shared("test:together", 30, upstream.load),
      shared("test:together", 30, upstream.load),
      shared("test:together", 30, upstream.load),
    ]);

    // then load follows the product, not the number of consumers
    expect(upstream.calls()).toBe(1);
    expect(answers).toEqual(["once", "once", "once"]);
  });

  it("should answer a later caller from what it already holds", async () => {
    // given one caller has already fetched
    const upstream = counted("held");
    await shared("test:held", 30, upstream.load);

    // when another asks inside the fresh window
    const answer = await shared("test:held", 30, upstream.load);

    // then
    expect(upstream.calls()).toBe(1);
    expect(answer).toBe("held");
  });
});

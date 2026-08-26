import { beforeEach, describe, expect, it, vi } from "vitest";

// The module holds the counters, so each case needs its own copy of it.
const load = async () => {
  vi.resetModules();

  return import("./cache");
};

describe("countUp", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("should answer zero for a key nothing has counted", async () => {
    // given
    const { readCount } = await load();

    // when, then
    expect(await readCount("nothing")).toBe(0);
  });

  it("should add one each time and keep the running total", async () => {
    // given
    const { countUp, readCount } = await load();

    // when
    await countUp("a", 60);
    await countUp("a", 60);
    const third = await countUp("a", 60);

    // then
    expect(third).toBe(3);
    expect(await readCount("a")).toBe(3);
  });

  it("should keep two keys apart", async () => {
    // given
    const { countUp, readCount } = await load();

    // when
    await countUp("a", 60);
    await countUp("b", 60);

    // then
    expect(await readCount("a")).toBe(1);
    expect(await readCount("b")).toBe(1);
  });

  it("should forget a count once its window has run out", async () => {
    // given a count taken a minute ago
    vi.useFakeTimers();

    const { countUp, readCount } = await load();

    await countUp("a", 60);

    // when the window passes
    vi.advanceTimersByTime(61_000);

    // then it starts again rather than carrying on
    expect(await readCount("a")).toBe(0);
    expect(await countUp("a", 60)).toBe(1);
  });

  it("should clear a count outright", async () => {
    // given
    const { clearCount, countUp, readCount } = await load();

    await countUp("a", 60);

    // when
    await clearCount("a");

    // then
    expect(await readCount("a")).toBe(0);
  });
});

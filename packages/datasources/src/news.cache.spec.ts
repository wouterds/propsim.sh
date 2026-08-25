import { afterEach, describe, expect, it, vi } from "vitest";

const ROW = {
  title: "Non-Farm Employment Change",
  country: "USD",
  date: "2026-09-04T08:30:00-04:00",
  impact: "High",
};

// The module holds the calendar, so each case needs its own copy of it.
const load = async () => {
  vi.resetModules();

  return import("./news");
};

const answer = (rows: unknown) =>
  vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(rows) });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getNewsEvents", () => {
  it("should read the feed once however often it is asked", async () => {
    // given
    const fetched = answer([ROW]);
    vi.stubGlobal("fetch", fetched);
    const { getNewsEvents } = await load();

    // when
    await getNewsEvents();
    await getNewsEvents();
    await getNewsEvents();

    // then
    expect(fetched).toHaveBeenCalledTimes(1);
  });

  it("should give an empty calendar back rather than throwing when the feed is down", async () => {
    // given
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { getNewsEvents } = await load();

    // then
    await expect(getNewsEvents()).resolves.toEqual([]);
  });

  it("should keep the last calendar when a later read fails", async () => {
    // given a good read, then a feed that stops answering
    const fetched = answer([ROW]);
    vi.stubGlobal("fetch", fetched);
    const { getNewsEvents } = await load();
    const first = await getNewsEvents();

    // when the window has passed and the feed is down
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.setSystemTime(Date.now() + 60 * 60 * 1000);

    // then
    await expect(getNewsEvents()).resolves.toEqual(first);
    vi.useRealTimers();
  });
});

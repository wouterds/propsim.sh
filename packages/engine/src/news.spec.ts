import { describe, expect, it } from "vitest";
import type { Fill, Side } from "./fills";
import { priceUnits } from "./money";
import { activeWindow, heldSpansOf, heldThroughOf, nextWindow, windowsOf } from "./news";

const at = (iso: string) => new Date(iso).getTime();
const NFP = at("2026-09-04T12:30:00Z");

describe("windowsOf", () => {
  it("should give nothing back when nothing is scheduled", () => {
    // then
    expect(windowsOf([])).toEqual([]);
  });

  it("should open a minute before and close a minute after", () => {
    // given
    const windows = windowsOf([{ time: NFP, title: "Non-Farm Employment Change" }]);

    // then
    expect(windows[0]?.from).toBe(NFP - 60_000);
    expect(windows[0]?.to).toBe(NFP + 60_000);
  });

  it("should merge releases that share a window", () => {
    // given two prints at the same moment, which is how NFP arrives
    const windows = windowsOf([
      { time: NFP, title: "Non-Farm Employment Change" },
      { time: NFP, title: "Unemployment Rate" },
    ]);

    // then
    expect(windows).toHaveLength(1);
    expect(windows[0]?.titles).toEqual(["Non-Farm Employment Change", "Unemployment Rate"]);
  });

  it("should keep releases far enough apart as separate windows", () => {
    // given two releases three minutes apart, which the windows cannot span
    const windows = windowsOf([
      { time: NFP, title: "Non-Farm Employment Change" },
      { time: NFP + 180_000, title: "ISM Manufacturing PMI" },
    ]);

    // then
    expect(windows).toHaveLength(2);
  });

  it("should sort the calendar before merging", () => {
    // given the later release listed first
    const windows = windowsOf([
      { time: NFP + 180_000, title: "ISM" },
      { time: NFP, title: "NFP" },
    ]);

    // then
    expect(windows[0]?.titles).toEqual(["NFP"]);
  });
});

describe("activeWindow", () => {
  const windows = windowsOf([{ time: NFP, title: "Non-Farm Employment Change" }]);

  it("should count both edges as inside", () => {
    // then
    expect(activeWindow(windows, NFP - 60_000)).not.toBeNull();
    expect(activeWindow(windows, NFP + 60_000)).not.toBeNull();
  });

  it("should be clear a moment either side", () => {
    // then
    expect(activeWindow(windows, NFP - 60_001)).toBeNull();
    expect(activeWindow(windows, NFP + 60_001)).toBeNull();
  });
});

describe("nextWindow", () => {
  it("should skip a window already open", () => {
    // given one running now and one later
    const windows = windowsOf([
      { time: NFP, title: "NFP" },
      { time: NFP + 3_600_000, title: "FOMC" },
    ]);

    // then
    expect(nextWindow(windows, NFP)?.titles).toEqual(["FOMC"]);
  });

  it("should give nothing back once the calendar is spent", () => {
    // then
    expect(nextWindow(windowsOf([{ time: NFP, title: "NFP" }]), NFP + 86_400_000)).toBeNull();
  });
});

const fill = (side: Side, quantity: number, at: number, instrument = "MES"): Fill => ({
  instrument,
  side,
  quantity,
  price: priceUnits(5_000),
  at: new Date(at),
  tradeDate: "2026-09-04",
});

const windows = windowsOf([{ time: NFP, title: "Non-Farm Employment Change" }]);
const minute = 60_000;

describe("heldSpansOf", () => {
  it("should give nothing back for a stream that never opened anything", () => {
    // then
    expect(heldSpansOf([])).toEqual([]);
  });

  it("should close a stretch when the last contract goes flat", () => {
    // given a position opened and closed
    const spans = heldSpansOf([fill("buy", 1, NFP), fill("sell", 1, NFP + minute)]);

    // then
    expect(spans).toEqual([{ from: NFP, to: NFP + minute }]);
  });

  it("should read two round trips as two stretches, not one", () => {
    // given a position closed and a second opened later
    const spans = heldSpansOf([
      fill("buy", 1, NFP),
      fill("sell", 1, NFP + minute),
      fill("buy", 1, NFP + 10 * minute),
      fill("sell", 1, NFP + 11 * minute),
    ]);

    // then joining them would read the flat gap between as time held
    expect(spans).toHaveLength(2);
    expect(spans[1]).toEqual({ from: NFP + 10 * minute, to: NFP + 11 * minute });
  });

  it("should stay open while one contract is flat and another is not", () => {
    // given a second contract opened before the first is closed
    const spans = heldSpansOf([
      fill("buy", 1, NFP, "MES"),
      fill("buy", 1, NFP + minute, "MNQ"),
      fill("sell", 1, NFP + 2 * minute, "MES"),
    ]);

    // then flat means flat everywhere, so the stretch is still running
    expect(spans).toEqual([{ from: NFP, to: null }]);
  });

  it("should leave a stretch open while the position still is", () => {
    // given a position that was never closed
    expect(heldSpansOf([fill("buy", 2, NFP)])).toEqual([{ from: NFP, to: null }]);
  });
});

describe("heldThroughOf", () => {
  it("should leave an account that was flat across the window alone", () => {
    // given a trade closed before the window opened and one opened after it shut
    const fills = [
      fill("buy", 1, NFP - 5 * minute),
      fill("sell", 1, NFP - 2 * minute),
      fill("buy", 1, NFP + 2 * minute),
    ];

    // then
    expect(heldThroughOf(fills, windows, NFP + 10 * minute)).toBeNull();
  });

  it("should catch a position carried through the release", () => {
    // given a position opened well before and closed well after
    const fills = [fill("buy", 1, NFP - 5 * minute), fill("sell", 1, NFP + 5 * minute)];

    // then
    expect(heldThroughOf(fills, windows, NFP + 10 * minute)?.at).toBe(NFP);
  });

  it("should catch a position opened and closed inside the window", () => {
    // given a trade that lived entirely within the blackout
    const fills = [fill("buy", 1, NFP), fill("sell", 1, NFP + 30_000)];

    // then the rule is to be flat, not to avoid finishing the window in a trade
    expect(heldThroughOf(fills, windows, NFP + 10 * minute)).not.toBeNull();
  });

  it("should count a position closed on the instant the window opens", () => {
    // given a close at exactly one minute before the release
    const fills = [fill("buy", 1, NFP - 5 * minute), fill("sell", 1, NFP - minute)];

    // then both edges count as inside, the same as everywhere else here
    expect(heldThroughOf(fills, windows, NFP + 10 * minute)).not.toBeNull();
  });

  it("should leave a close one millisecond before the window alone", () => {
    // given the same trade shut a millisecond earlier
    const fills = [fill("buy", 1, NFP - 5 * minute), fill("sell", 1, NFP - minute - 1)];

    // then
    expect(heldThroughOf(fills, windows, NFP + 10 * minute)).toBeNull();
  });

  it("should not breach on a window that has not happened yet", () => {
    // given a position open now, and a release still to come
    const fills = [fill("buy", 1, NFP - 60 * minute)];

    // then an open position runs to now, never into the future
    expect(heldThroughOf(fills, windows, NFP - 5 * minute)).toBeNull();
    expect(heldThroughOf(fills, windows, NFP)).not.toBeNull();
  });
});

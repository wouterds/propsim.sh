import { describe, expect, it } from "vitest";
import { activeWindow, windowsOf } from "./blackout";

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

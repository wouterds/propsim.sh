import { describe, expect, it } from "vitest";
import { logicalAt } from "./chart-scale";

const minute = 60_000;
const start = Date.UTC(2026, 7, 25, 9, 0);
// Four bars a minute apart, then a gap, the way a session break arrives.
const times = [start, start + minute, start + 2 * minute, start + 62 * minute];

describe("logicalAt", () => {
  it("should give nothing back when there is no interval to measure", () => {
    // then
    expect(logicalAt([], start)).toBeNull();
    expect(logicalAt([start], start)).toBeNull();
  });

  it("should land on the index of a bar it is given exactly", () => {
    // then
    expect(logicalAt(times, times[0])).toBe(0);
    expect(logicalAt(times, times[2])).toBe(2);
    expect(logicalAt(times, times[3])).toBe(3);
  });

  it("should fall between two bars in proportion to the time", () => {
    // given halfway through the first bar
    // then
    expect(logicalAt(times, start + minute / 2)).toBe(0.5);
  });

  it("should divide a gap by the gap, not by the bar length", () => {
    // given halfway across the session break, which is one bar wide on screen
    const middle = times[2] + (times[3] - times[2]) / 2;

    // then
    expect(logicalAt(times, middle)).toBe(2.5);
  });

  it("should read before the first bar as a negative index", () => {
    // then
    expect(logicalAt(times, start - minute)).toBe(-1);
  });

  it("should carry on past the last bar", () => {
    // then
    expect(logicalAt(times, times[3] + minute)).toBe(4);
  });
});

import { describe, expect, it } from "vitest";
import type { Printed } from "./dance";
import { closeStepOf, isOpenAt, tradeDateOf } from "./session";

describe("tradeDateOf", () => {
  it("should keep the last second before the roll on the day that is ending", () => {
    // given 16:59:59 in Chicago, on a summer date
    const at = new Date("2026-08-25T21:59:59Z");

    // then
    expect(tradeDateOf(at)).toBe("2026-08-25");
  });

  it("should hand the first second after the roll to the next day", () => {
    // given 17:00:00 in Chicago
    const at = new Date("2026-08-25T22:00:00Z");

    // then
    expect(tradeDateOf(at)).toBe("2026-08-26");
  });

  it("should cut on the Chicago clock rather than a fixed offset from UTC", () => {
    // given 16:59:59 in Chicago in winter, an hour further from UTC than in summer
    const at = new Date("2026-01-05T22:59:59Z");

    // then the session has not rolled yet
    expect(tradeDateOf(at)).toBe("2026-01-05");
  });

  it("should roll into the next month", () => {
    // given the open of the session that follows the last day of August
    const at = new Date("2026-08-31T22:00:00Z");

    // then
    expect(tradeDateOf(at)).toBe("2026-09-01");
  });
});

describe("isOpenAt", () => {
  it("should shut a weekday at the close and reopen it at the roll", () => {
    // given a Tuesday in summer, when Chicago is five hours behind UTC
    expect(isOpenAt(new Date("2026-08-25T20:44:59Z"))).toBe(true);
    expect(isOpenAt(new Date("2026-08-25T20:45:00Z"))).toBe(false);
    expect(isOpenAt(new Date("2026-08-25T21:59:59Z"))).toBe(false);
    expect(isOpenAt(new Date("2026-08-25T22:00:00Z"))).toBe(true);
  });

  it("should stay shut from Friday's close until Sunday's roll", () => {
    // given Friday 2026-08-28 and the Sunday after it
    expect(isOpenAt(new Date("2026-08-28T20:44:00Z"))).toBe(true);
    expect(isOpenAt(new Date("2026-08-28T22:00:00Z"))).toBe(false);
    expect(isOpenAt(new Date("2026-08-29T15:00:00Z"))).toBe(false);
    expect(isOpenAt(new Date("2026-08-30T21:59:59Z"))).toBe(false);
    expect(isOpenAt(new Date("2026-08-30T22:00:00Z"))).toBe(true);
  });

  it("should read the close off the Chicago clock rather than a fixed offset", () => {
    // given a Monday in winter, an hour further from UTC than in summer
    expect(isOpenAt(new Date("2026-01-05T21:44:59Z"))).toBe(true);
    expect(isOpenAt(new Date("2026-01-05T21:45:00Z"))).toBe(false);
  });
});

describe("closeStepOf", () => {
  const step = (iso: string, close: number): Printed => ({
    time: new Date(iso).getTime(),
    open: close,
    high: close,
    low: close,
    close,
  });

  it("should say nothing while every step is inside the session", () => {
    // given
    const steps = [step("2026-08-25T20:44:50Z", 1), step("2026-08-25T20:44:55Z", 2)];

    // then
    expect(closeStepOf(steps, 0)).toBeNull();
  });

  it("should hand back the first shut step and the last open one before it", () => {
    // given steps either side of the close, out of order
    const steps = [
      step("2026-08-25T20:45:05Z", 4),
      step("2026-08-25T20:44:55Z", 2),
      step("2026-08-25T20:45:00Z", 3),
      step("2026-08-25T20:44:50Z", 1),
    ];

    // when
    const found = closeStepOf(steps, 0);

    // then
    expect(found?.at).toBe(new Date("2026-08-25T20:45:00Z").getTime());
    expect(found?.last?.close).toBe(2);
  });

  it("should ignore steps before the position opened", () => {
    // given a position opened on the closing step itself
    const steps = [step("2026-08-25T20:44:55Z", 2), step("2026-08-25T20:45:00Z", 3)];

    // when
    const found = closeStepOf(steps, new Date("2026-08-25T20:45:00Z").getTime());

    // then there was no open step to price the flatten off
    expect(found?.last).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { tradeDateOf } from "./session";

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

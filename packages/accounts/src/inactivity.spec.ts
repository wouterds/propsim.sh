import { describe, expect, it } from "vitest";
import { daysLeft, stageOf } from "./inactivity";

const NOW = new Date("2026-08-25T12:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

describe("stageOf", () => {
  it("should leave an account alone for its first three months", () => {
    // given a day either side of the boundary
    // then
    expect(stageOf(daysAgo(89), NOW)).toBe("active");
    expect(stageOf(daysAgo(90), NOW)).toBe("warn");
  });

  it("should hold the first notice for a month", () => {
    // then
    expect(stageOf(daysAgo(119), NOW)).toBe("warn");
    expect(stageOf(daysAgo(120), NOW)).toBe("final");
  });

  it("should empty the account a month after the last notice", () => {
    // then
    expect(stageOf(daysAgo(149), NOW)).toBe("final");
    expect(stageOf(daysAgo(150), NOW)).toBe("scrub");
  });

  it("should not read a clock skewed into the future as a dormant account", () => {
    // given a stamp from tomorrow, which is a negative age
    // then
    expect(stageOf(new Date(NOW.getTime() + 60_000), NOW)).toBe("active");
  });
});

describe("daysLeft", () => {
  it("should count down to the day the account is emptied", () => {
    // given the two days a notice goes out on
    // then
    expect(daysLeft(daysAgo(90), NOW)).toBe(60);
    expect(daysLeft(daysAgo(120), NOW)).toBe(30);
  });

  it("should never promise time an account has already used up", () => {
    // then
    expect(daysLeft(daysAgo(200), NOW)).toBe(0);
  });
});

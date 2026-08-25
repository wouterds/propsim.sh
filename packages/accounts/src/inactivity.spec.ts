import { describe, expect, it } from "vitest";
import { daysLeft, stageOf } from "./inactivity";

const NOW = new Date("2026-08-25T12:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

describe("stageOf", () => {
  it("should leave an account alone until the first month is up", () => {
    // given a day either side of the boundary
    // then
    expect(stageOf(daysAgo(29), NOW)).toBe("active");
    expect(stageOf(daysAgo(30), NOW)).toBe("warn");
  });

  it("should hold the first notice until the second month is up", () => {
    // then
    expect(stageOf(daysAgo(59), NOW)).toBe("warn");
    expect(stageOf(daysAgo(60), NOW)).toBe("final");
  });

  it("should empty the account once the third month is up", () => {
    // then
    expect(stageOf(daysAgo(89), NOW)).toBe("final");
    expect(stageOf(daysAgo(90), NOW)).toBe("scrub");
  });

  it("should not read a clock skewed into the future as a dormant account", () => {
    // given a stamp from tomorrow, which is a negative age
    // then
    expect(stageOf(new Date(NOW.getTime() + 60_000), NOW)).toBe("active");
  });
});

describe("daysLeft", () => {
  it("should count down to the day the account is emptied", () => {
    // then
    expect(daysLeft(daysAgo(30), NOW)).toBe(60);
    expect(daysLeft(daysAgo(60), NOW)).toBe(30);
  });

  it("should never promise time an account has already used up", () => {
    // then
    expect(daysLeft(daysAgo(120), NOW)).toBe(0);
  });
});

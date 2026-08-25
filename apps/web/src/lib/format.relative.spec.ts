import { describe, expect, it } from "vitest";
import { countryOf, formatCountdown, formatRelative } from "./format";

const at = (iso: string) => new Date(iso);
const NOW = at("2026-08-25T12:00:00Z");

describe("formatRelative", () => {
  it("should call anything inside two minutes active now", () => {
    // then
    expect(formatRelative(at("2026-08-25T11:59:00Z"), NOW)).toBe("Active now");
    expect(formatRelative(NOW, NOW)).toBe("Active now");
  });

  it("should step up a unit only once the span is reached", () => {
    // given a moment either side of the hour boundary
    // then
    expect(formatRelative(at("2026-08-25T11:01:00Z"), NOW)).toBe("59 minutes ago");
    expect(formatRelative(at("2026-08-25T11:00:00Z"), NOW)).toBe("1 hour ago");
  });

  it("should count days and months rather than thousands of minutes", () => {
    // then
    expect(formatRelative(at("2026-08-23T12:00:00Z"), NOW)).toBe("2 days ago");
    expect(formatRelative(at("2026-06-25T12:00:00Z"), NOW)).toBe("2 months ago");
  });
});

describe("countryOf", () => {
  it("should give nothing back when the address could not be placed", () => {
    // then
    expect(countryOf(null)).toBeNull();
  });

  it("should name the country and build its flag", () => {
    // then
    expect(countryOf("BE")).toEqual({ name: "Belgium", flag: "🇧🇪" });
  });
});

describe("formatCountdown", () => {
  it("should count towards a moment rather than away from it", () => {
    // then
    expect(formatCountdown(at("2026-08-27T12:00:00Z"), NOW)).toBe("in 2 days");
    expect(formatCountdown(at("2026-08-25T15:00:00Z"), NOW)).toBe("in 3 hours");
  });

  it("should never round a moment still ahead down to nothing", () => {
    // given thirty seconds out, which floors to zero minutes
    // then
    expect(formatCountdown(at("2026-08-25T12:00:30Z"), NOW)).toBe("in 1 minute");
  });

  it("should hand a moment already gone back to the other one", () => {
    // then
    expect(formatCountdown(at("2026-08-25T09:00:00Z"), NOW)).toBe("3 hours ago");
  });
});

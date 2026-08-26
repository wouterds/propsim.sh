import { describe, expect, it } from "vitest";
import { chicagoTime, money } from "./format";

describe("chicagoTime", () => {
  it("should say which zone it is, and be readable at all", () => {
    // given 14:30 UTC on a summer day, which is 09:30 in Chicago
    const at = Date.UTC(2026, 7, 26, 14, 30);

    // when
    const formatted = chicagoTime(at);

    // then Intl throws at construction on a bad option pairing, so a formatter
    // that names a zone at all is the whole assertion, and the hour proves the
    // zone is Chicago rather than wherever this happens to run
    expect(formatted).toContain("9:30");
    expect(formatted).toContain("CDT");
    expect(formatted).toContain("2026");
  });

  it("should follow Chicago across the daylight saving boundary", () => {
    // given the same clock time in January, when Chicago is an hour further back
    const winter = chicagoTime(Date.UTC(2026, 0, 26, 14, 30));

    // then
    expect(winter).toContain("8:30");
    expect(winter).toContain("CST");
  });
});

describe("money", () => {
  it("should read cents as dollars", () => {
    // then
    expect(money(4_988_000)).toBe("$49,880.00");
    expect(money(-12_050)).toBe("-$120.50");
  });
});

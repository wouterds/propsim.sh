import { describe, expect, it } from "vitest";
import { asPage, safeReturn } from "./redirect.server";

describe("safeReturn", () => {
  it("should refuse an absolute url", () => {
    expect(safeReturn("https://evil.example/steal")).toBe("/dash");
  });

  it("should refuse a protocol relative url", () => {
    expect(safeReturn("//evil.example/steal")).toBe("/dash");
  });

  it("should refuse a tab hidden inside the slashes", () => {
    expect(safeReturn("/\t/evil.example")).toBe("/dash");
  });

  it("should refuse a path that climbs back to another host", () => {
    expect(safeReturn("/..//evil.example")).toBe("/dash");
  });

  it("should refuse a backslash the parser reads as a slash", () => {
    expect(safeReturn("/\\evil.example")).toBe("/dash");
  });

  it("should refuse the auth page itself", () => {
    expect(safeReturn("/auth")).toBe("/dash");
  });

  it("should refuse a single fetch data path", () => {
    expect(safeReturn("/trading.data")).toBe("/dash");
  });

  it("should refuse nothing at all", () => {
    expect(safeReturn(null)).toBe("/dash");
  });

  it("should keep a local path and its query", () => {
    expect(safeReturn("/trading?tf=15m")).toBe("/trading?tf=15m");
  });
});

describe("asPage", () => {
  it("should strip the single fetch suffix and its routing params", () => {
    // given
    const url = new URL("https://propsim.sh/trading.data?_routes=routes%2Ftrading&tf=15m");

    // then
    expect(asPage(url)).toBe("/trading?tf=15m");
  });

  it("should leave a plain document request alone", () => {
    // given
    const url = new URL("https://propsim.sh/trading?tf=15m");

    // then
    expect(asPage(url)).toBe("/trading?tf=15m");
  });
});

import { describe, expect, it } from "vitest";
import { formatRatio } from "./format";

describe("formatRatio", () => {
  it("should not pad a whole ratio out to two decimals", () => {
    // then
    expect(formatRatio(1)).toBe("1");
    expect(formatRatio(2)).toBe("2");
  });

  it("should keep the decimals a ratio actually has", () => {
    // then
    expect(formatRatio(1.5)).toBe("1.5");
    expect(formatRatio(4 / 3)).toBe("1.33");
  });

  it("should keep a ratio under one readable rather than rounding it away", () => {
    // then
    expect(formatRatio(0.5)).toBe("0.5");
  });
});

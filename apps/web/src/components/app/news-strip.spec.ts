import { describe, expect, it } from "vitest";
import { countdown } from "./news-strip";

describe("countdown", () => {
  it("should never count below zero", () => {
    // then
    expect(countdown(-5_000)).toBe("0:00.00");
  });

  it("should pad every field so the width does not jump", () => {
    // then
    expect(countdown(9_050)).toBe("0:09.05");
  });

  it("should show the hours once there are any", () => {
    // then
    expect(countdown(3 * 3_600_000 + 4 * 60_000 + 5_000 + 990)).toBe("3:04:05.99");
  });

  it("should round the hundredths down, so it never shows a time it has passed", () => {
    // then
    expect(countdown(1_999)).toBe("0:01.99");
  });
});

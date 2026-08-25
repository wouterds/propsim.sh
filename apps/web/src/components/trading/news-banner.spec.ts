import { describe, expect, it } from "vitest";
import { clock } from "./news-banner";

describe("clock", () => {
  it("should never count below zero", () => {
    // then
    expect(clock(-5)).toBe("0:00");
  });

  it("should pad the seconds so the width does not jump", () => {
    // then
    expect(clock(9)).toBe("0:09");
    expect(clock(69)).toBe("1:09");
  });
});

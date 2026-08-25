import { describe, expect, it } from "vitest";
import { asCode, CODE_DIGITS } from "./policy";

describe("asCode", () => {
  it("should give nothing back when the link carries no code", () => {
    // then
    expect(asCode(null)).toBe("");
  });

  it("should drop everything that is not a digit", () => {
    // given a code a mail client wrapped and spaced
    const wrapped = "41 89-24";

    // then
    expect(asCode(wrapped)).toBe("418924");
  });

  it("should keep a full code and cut anything longer", () => {
    // then
    expect(asCode("418924")).toHaveLength(CODE_DIGITS);
    expect(asCode("4189249999")).toBe("418924");
  });
});

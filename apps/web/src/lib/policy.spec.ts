import { describe, expect, it } from "vitest";
import {
  asCode,
  CODE_DIGITS,
  handleError,
  MAX_USERNAME,
  MIN_USERNAME,
  usernameError,
} from "./policy";

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

describe("usernameError", () => {
  it("should refuse a name that leads with a hyphen or an underscore", () => {
    // then
    expect(usernameError("-wouter")).not.toBeNull();
    expect(usernameError("_wouter")).not.toBeNull();
  });

  it("should refuse punctuation and symbols", () => {
    // then
    expect(usernameError("wouter.ds")).not.toBeNull();
    expect(usernameError("wouter@ds")).not.toBeNull();
    expect(usernameError("wouter/ds")).not.toBeNull();
  });

  it("should allow letters of any script, and a space between words", () => {
    // then
    expect(usernameError("Jinx ジンクス")).toBeNull();
    expect(usernameError("Wouter De Schuyter")).toBeNull();
    expect(usernameError("José")).toBeNull();
    expect(usernameError("Ольга")).toBeNull();
  });

  it("should hold both ends of the length", () => {
    // given names one either side of each limit
    const short = "a".repeat(MIN_USERNAME - 1);
    const shortest = "a".repeat(MIN_USERNAME);
    const longest = "a".repeat(MAX_USERNAME);
    const long = "a".repeat(MAX_USERNAME + 1);

    // then
    expect(usernameError(short)).not.toBeNull();
    expect(usernameError(shortest)).toBeNull();
    expect(usernameError(longest)).toBeNull();
    expect(usernameError(long)).not.toBeNull();
  });

  it("should allow a name that starts with a number and carries both separators", () => {
    // then
    expect(usernameError("0x_trader-9")).toBeNull();
  });
});

describe("handleError", () => {
  it("should refuse a pasted address, which is not a handle", () => {
    // given
    const wrong = handleError("https://x.com/someone");

    // when, then
    expect(wrong).not.toBeNull();
  });

  it("should refuse a handle with a slash in it", () => {
    // given, when, then
    expect(handleError("someone/status/1")).not.toBeNull();
  });

  it("should refuse one longer than the column holds", () => {
    // given
    expect(handleError("a".repeat(41))).not.toBeNull();

    // then the boundary itself is allowed
    expect(handleError("a".repeat(40))).toBeNull();
  });

  it("should take a plain handle", () => {
    // given, when, then
    expect(handleError("wouterds")).toBeNull();
    expect(handleError("some.one_else-99")).toBeNull();
  });
});

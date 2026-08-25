import { describe, expect, it } from "vitest";
import { formatSigned } from "./format";

describe("formatSigned", () => {
  it("should drop the sign on a value that rounds away to nothing", () => {
    // given
    const scratched = -0.004;

    // when
    const formatted = formatSigned(scratched);

    // then
    expect(formatted).toBe("$0.00");
  });

  it("should mark a gain and a loss of the same size differently", () => {
    // given, when, then
    expect(formatSigned(252.5)).toBe("+$252.50");
    expect(formatSigned(-252.5)).toBe("-$252.50");
  });
});

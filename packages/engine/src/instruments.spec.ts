import { describe, expect, it } from "vitest";
import { contractOf, DEFAULT_CODE, findInstrument, INSTRUMENTS, instrumentOr } from "./instruments";

describe("instruments", () => {
  it("should give every contract its own code and symbol", () => {
    // then
    expect(new Set(INSTRUMENTS.map((i) => i.code)).size).toBe(INSTRUMENTS.length);
    expect(new Set(INSTRUMENTS.map((i) => i.symbol)).size).toBe(INSTRUMENTS.length);
  });

  it("should price a tick at something a trader would recognise", () => {
    // given the published dollar value of one tick
    const perTick = (code: string) => {
      const found = instrumentOr(code);

      return Math.round(found.tick * found.point * 1000) / 1000;
    };

    // then
    expect(perTick("MES")).toBe(1.25);
    expect(perTick("MNQ")).toBe(0.5);
    expect(perTick("M2K")).toBe(0.5);
    expect(perTick("MYM")).toBe(0.5);
    expect(perTick("MGC")).toBe(1);
    expect(perTick("SIL")).toBe(5);
    expect(perTick("MHG")).toBe(12.5);
    expect(perTick("MCL")).toBe(1);
    expect(perTick("MNG")).toBe(2.5);
  });

  it("should fall back rather than return nothing for an unknown code", () => {
    // then
    expect(findInstrument("NOPE")).toBeNull();
    expect(instrumentOr("NOPE").code).toBe(DEFAULT_CODE);
    expect(instrumentOr(null).code).toBe(DEFAULT_CODE);
  });

  it("should refuse to price a stored fill against a contract it cannot find", () => {
    // given a code that has left the list
    // then it throws rather than pricing the fill as the default contract
    expect(() => contractOf("NOPE")).toThrow("unknown contract NOPE");
  });
});

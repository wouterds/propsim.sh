import { describe, expect, it } from "vitest";
import { isKnown } from "./sessions.server";

const mac = { browser: "Chrome", os: "macOS", country: "BE" };

describe("isKnown", () => {
  it("should not recognise anything when nothing was seen before", () => {
    // then
    expect(isKnown([], mac)).toBe(false);
  });

  it("should recognise the same browser and system in the same country", () => {
    // then
    expect(isKnown([mac], { ...mac })).toBe(true);
  });

  it("should still recognise it after the browser updated itself", () => {
    // given the version is never part of what is stored
    // then
    expect(isKnown([{ browser: "Chrome", os: "macOS", country: "BE" }], mac)).toBe(true);
  });

  it("should not recognise the same browser from another country", () => {
    // then
    expect(isKnown([mac], { ...mac, country: "NL" })).toBe(false);
  });

  it("should not recognise a different system", () => {
    // then
    expect(isKnown([mac], { ...mac, os: "iOS" })).toBe(false);
  });

  it("should match a place it could not read against another it could not read", () => {
    // given two sign ins where no country header arrived
    const unplaced = { browser: "Chrome", os: "macOS", country: null };

    // then
    expect(isKnown([unplaced], unplaced)).toBe(true);
  });
});

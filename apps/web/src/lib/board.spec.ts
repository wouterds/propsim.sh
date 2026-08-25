import { describe, expect, it } from "vitest";
import { featureIdOf, featurePath } from "./board";

const ID = "01997e51-1a40-7000-9c3b-5f2a11d4e880";

const segment = (path: string) => path.replace("/feature-requests/", "");

describe("featureIdOf", () => {
  it("should give nothing back for an address that was never one of ours", () => {
    // then
    expect(featureIdOf("add-a-dark-mode")).toBeNull();
    expect(featureIdOf("")).toBeNull();
  });

  it("should read the id off the front of the slug", () => {
    // then
    expect(featureIdOf(`${ID}-add-a-dark-mode`)).toBe(ID);
  });

  it("should read an id that arrives shouted", () => {
    // given an address somebody upper cased on the way through
    // then
    expect(featureIdOf(`${ID.toUpperCase()}-add-a-dark-mode`)).toBe(ID);
  });
});

describe("featurePath", () => {
  it("should fall back to the bare id when the title leaves nothing behind", () => {
    // then
    expect(featurePath(ID, "!?!")).toBe(`/feature-requests/${ID}`);
  });

  it("should come back as the id it was built from", () => {
    // given
    const path = featurePath(ID, "Add a dark mode, please!");

    // then
    expect(path).toBe(`/feature-requests/${ID}-add-a-dark-mode-please`);
    expect(featureIdOf(segment(path))).toBe(ID);
  });

  it("should keep an accented word whole rather than splitting it", () => {
    // then
    expect(featurePath(ID, "Café hours")).toBe(`/feature-requests/${ID}-cafe-hours`);
  });

  it("should leave no dash hanging where the title was cut short", () => {
    // given a title whose sixtieth character is the separator
    const title = `${"a".repeat(59)} bcdefgh`;

    // then
    expect(featurePath(ID, title)).toBe(`/feature-requests/${ID}-${"a".repeat(59)}`);
  });
});

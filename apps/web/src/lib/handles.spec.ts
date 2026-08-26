import { describe, expect, it } from "vitest";
import { linkTo, readHandle } from "./handles";

describe("readHandle", () => {
  it("should refuse something that cannot be a handle", () => {
    // given
    const read = readHandle("twitter", "not a handle!");

    // when, then
    expect(read.handle).toBeNull();
    expect(read.error).not.toBeNull();
  });

  it("should take an empty field as nothing rather than as wrong", () => {
    // given, when, then
    expect(readHandle("twitter", "   ")).toEqual({ handle: null, error: null });
  });

  it("should read the same account out of every way it gets pasted", () => {
    // given the three shapes people paste
    const shapes = [
      "jinxcapital",
      "@jinxcapital",
      "https://x.com/jinxcapital",
      "http://www.x.com/jinxcapital/",
      "x.com/jinxcapital?s=21",
      "https://twitter.com/jinxcapital",
      "https://mobile.twitter.com/@jinxcapital",
    ];

    // when each is read
    // then they all normalise to one stored value
    for (const shape of shapes) {
      expect(readHandle("twitter", shape)).toEqual({ handle: "jinxcapital", error: null });
    }
  });

  it("should refuse an X handle longer than the site allows", () => {
    // given sixteen characters
    expect(readHandle("twitter", "a".repeat(16)).handle).toBeNull();

    // then fifteen is fine
    expect(readHandle("twitter", "a".repeat(15)).handle).toBe("a".repeat(15));
  });

  it("should take a youtube handle out of its address", () => {
    // given
    expect(readHandle("youtube", "https://youtube.com/@jinx").handle).toBe("jinx");
    expect(readHandle("youtube", "@jinx").handle).toBe("jinx");
  });

  it("should send a channel id back rather than store one it cannot link to", () => {
    // given a channel address instead of a handle
    const read = readHandle("youtube", "https://youtube.com/channel/UCabcdef123456");

    // when, then
    expect(read.handle).toBeNull();
    expect(read.error).toContain("@handle");
  });

  it("should take a twitch name out of its address", () => {
    // given, when, then
    expect(readHandle("twitch", "https://twitch.tv/jinxcapital").handle).toBe("jinxcapital");
    expect(readHandle("twitch", "jinxcapital").handle).toBe("jinxcapital");
  });

  it("should refuse a twitch name shorter than the site allows", () => {
    // given three characters
    expect(readHandle("twitch", "abc").handle).toBeNull();

    // then four is fine
    expect(readHandle("twitch", "abcd").handle).toBe("abcd");
  });

  it("should never carry a host into the stored value", () => {
    // given an address for the wrong site entirely
    const read = readHandle("twitch", "https://example.com/somebody");

    // when, then it is not silently stored as a path
    expect(read.handle).toBeNull();
  });
});

describe("linkTo", () => {
  it("should build the address from the handle rather than from what was typed", () => {
    // given, when, then
    expect(linkTo("twitter", "jinx")).toBe("https://x.com/jinx");
    expect(linkTo("youtube", "jinx")).toBe("https://youtube.com/@jinx");
    expect(linkTo("twitch", "jinx")).toBe("https://twitch.tv/jinx");
  });
});

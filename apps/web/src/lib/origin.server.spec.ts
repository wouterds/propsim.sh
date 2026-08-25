import { describe, expect, it } from "vitest";
import { readOrigin } from "./origin.server";

const asRequest = (headers: Record<string, string>) =>
  new Request("https://propsim.sh/", { headers });

describe("readOrigin", () => {
  it("should give nothing back when the request carries no headers", () => {
    // then
    expect(readOrigin(asRequest({}))).toEqual({ ip: null, country: null, userAgent: null });
  });

  it("should prefer the address cloudflare vouched for over the forwarded chain", () => {
    // given a chain a caller could have prepended to
    const request = asRequest({
      "cf-connecting-ip": "203.0.113.7",
      "x-forwarded-for": "198.51.100.1, 203.0.113.7",
    });

    // then
    expect(readOrigin(request).ip).toBe("203.0.113.7");
  });

  it("should read only the first entry of the forwarded chain", () => {
    // given
    const request = asRequest({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" });

    // then
    expect(readOrigin(request).ip).toBe("198.51.100.1");
  });

  it("should refuse a country cloudflare could not place", () => {
    // then
    expect(readOrigin(asRequest({ "cf-ipcountry": "XX" })).country).toBeNull();
    expect(readOrigin(asRequest({ "cf-ipcountry": "T1" })).country).toBeNull();
    expect(readOrigin(asRequest({ "cf-ipcountry": "be" })).country).toBe("BE");
  });

  it("should cut a user agent that would not fit the column", () => {
    // given
    const request = asRequest({ "user-agent": "a".repeat(600) });

    // then
    expect(readOrigin(request).userAgent).toHaveLength(512);
  });
});

import { describe, expect, it } from "vitest";
import { describeDevice, readDevice } from "./device";

const CHROME_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const EDGE_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const SAFARI_IPAD =
  "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/604.1";

describe("readDevice", () => {
  it("should give back nothing recognisable when there is no user agent", () => {
    // then
    expect(readDevice(null)).toEqual({ browser: null, os: null, kind: "unknown" });
    expect(readDevice("  ")).toEqual({ browser: null, os: null, kind: "unknown" });
  });

  it("should prefer the specific browser over the engine it claims", () => {
    // given a string that names Chrome and Safari as well as Edge
    // then
    expect(readDevice(EDGE_WINDOWS).browser).toBe("Edge");
    expect(readDevice(CHROME_MAC).browser).toBe("Chrome");
  });

  it("should tell a phone from a tablet running the same browser", () => {
    // then
    expect(readDevice(SAFARI_IPHONE).kind).toBe("mobile");
    expect(readDevice(SAFARI_IPAD).kind).toBe("tablet");
  });

  it("should not fall through to Safari when the chrome token is prefixed", () => {
    // given the headless build, whose token has no word boundary before Chrome
    const headless =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.0.0 Safari/537.36";

    // then
    expect(readDevice(headless).browser).toBe("Chrome");
  });

  it("should mark a crawler rather than calling it a desktop", () => {
    // then
    expect(readDevice("Mozilla/5.0 (compatible; Googlebot/2.1)").kind).toBe("bot");
  });

  it("should read a version bump as the same browser and system", () => {
    // given the same browser one major version later
    const later = CHROME_MAC.replace("140.0.0.0", "141.0.0.0");

    // then
    expect(readDevice(later)).toEqual(readDevice(CHROME_MAC));
  });
});

describe("describeDevice", () => {
  it("should fall back rather than print a half sentence", () => {
    // then
    expect(describeDevice({ browser: null, os: null })).toBe("Unknown device");
    expect(describeDevice({ browser: "Chrome", os: null })).toBe("Chrome");
    expect(describeDevice(readDevice(CHROME_MAC))).toBe("Chrome on macOS");
  });
});

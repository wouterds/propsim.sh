import { afterEach, describe, expect, it, vi } from "vitest";
import { codeMatches, expiresAt, generateCode, hashCode } from "./verification.server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("hashCode", () => {
  it("should throw when the key is missing", () => {
    // given
    vi.stubEnv("EMAIL_CODE_SECRET", "");

    // then
    expect(() => hashCode("123456")).toThrow("EMAIL_CODE_SECRET is not set");
  });

  it("should produce a different hash under a different key", () => {
    // given
    vi.stubEnv("EMAIL_CODE_SECRET", "one");
    const first = hashCode("123456");

    // when
    vi.stubEnv("EMAIL_CODE_SECRET", "two");
    const second = hashCode("123456");

    // then
    expect(first).not.toBe(second);
  });
});

describe("codeMatches", () => {
  it("should reject a hash of the wrong length", () => {
    // given
    vi.stubEnv("EMAIL_CODE_SECRET", "key");

    // then
    expect(codeMatches("123456", "abcd")).toBe(false);
  });

  it("should reject the wrong code", () => {
    // given
    vi.stubEnv("EMAIL_CODE_SECRET", "key");
    const hash = hashCode("123456");

    // then
    expect(codeMatches("654321", hash)).toBe(false);
  });

  it("should accept the right code", () => {
    // given
    vi.stubEnv("EMAIL_CODE_SECRET", "key");
    const hash = hashCode("123456");

    // then
    expect(codeMatches("123456", hash)).toBe(true);
  });
});

describe("generateCode", () => {
  it("should keep the leading zero on a small draw", () => {
    // given
    const codes = Array.from({ length: 200 }, () => generateCode());

    // then
    expect(codes.every((code) => code.length === 6)).toBe(true);
    expect(codes.every((code) => /^\d{6}$/.test(code))).toBe(true);
  });
});

describe("expiresAt", () => {
  it("should expire ten minutes out", () => {
    // given
    const now = new Date("2026-01-05T00:00:00Z");

    // then
    expect(expiresAt(now).toISOString()).toBe("2026-01-05T00:10:00.000Z");
  });
});

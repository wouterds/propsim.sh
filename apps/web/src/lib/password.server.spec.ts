import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.server";

describe("verifyPassword", () => {
  it("should reject a hash in an unknown format", async () => {
    // given
    const stored = "$2b$10$abcdefghijklmnopqrstuv";

    // when
    const verified = await verifyPassword("hunter2", stored);

    // then
    expect(verified).toBe(false);
  });

  it("should reject the wrong password", async () => {
    // given
    const stored = await hashPassword("hunter2");

    // when
    const verified = await verifyPassword("hunter3", stored);

    // then
    expect(verified).toBe(false);
  });

  it("should accept the right password", async () => {
    // given
    const stored = await hashPassword("hunter2");

    // when
    const verified = await verifyPassword("hunter2", stored);

    // then
    expect(verified).toBe(true);
  });

  it("should verify against the cost the hash was made with", async () => {
    // given
    const stored = (await hashPassword("hunter2")).replace("scrypt$16384$", "scrypt$1024$");

    // then
    await expect(verifyPassword("hunter2", stored)).resolves.toBe(false);
  });
});

describe("hashPassword", () => {
  it("should salt every hash separately", async () => {
    // when
    const first = await hashPassword("hunter2");
    const second = await hashPassword("hunter2");

    // then
    expect(first).not.toBe(second);
  });
});

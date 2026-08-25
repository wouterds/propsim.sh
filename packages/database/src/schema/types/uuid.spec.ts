import { eq } from "drizzle-orm";
import { mysqlTable } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UUIDv7, uuid } from "./uuid";

const probe = mysqlTable("probe", { id: uuid("id") });

const db = drizzle.mock();

afterEach(() => {
  vi.restoreAllMocks();
});

describe("uuid", () => {
  it("should refuse a value that is not 32 hex characters", () => {
    // when
    const write = () => probe.id.mapToDriverValue("abc'; drop table orders; --");

    // then
    expect(write).toThrow("invalid uuid");
  });

  it("should bind the id as a parameter rather than inlining it into the statement", () => {
    // given
    const id = "0192abcd-ef01-7f23-9c45-6789abcdef01";

    // when
    const query = db.select().from(probe).where(eq(probe.id, id)).toSQL();

    // then
    expect(query.sql).not.toContain("0192abcd");
    expect(query.params).toEqual([Buffer.from(id.replace(/-/g, ""), "hex")]);
  });

  it("should keep leading zero bytes when reading a row back", () => {
    // given
    const id = "00000000-0000-7000-8000-000000000001";

    // when
    const read = probe.id.mapFromDriverValue(Buffer.from(id.replace(/-/g, ""), "hex"));

    // then
    expect(read).toBe(id);
  });
});

describe("UUIDv7", () => {
  // Six distinct bytes on purpose: with a repeated one, a generator that packs
  // the millisecond in the wrong order still prints the right prefix, and the
  // time ordering the BINARY(16) primary keys lean on is gone with nothing red.
  it("should write the millisecond big endian across the leading 48 bits", () => {
    // given
    vi.spyOn(Date, "now").mockReturnValue(0x010203040506);

    // when
    const id = UUIDv7();

    // then
    expect(id.slice(0, 13)).toBe("01020304-0506");
  });

  it("should set the version to 7 and the variant to RFC 4122", () => {
    // when
    const id = UUIDv7();

    // then
    expect(id[14]).toBe("7");
    expect(Number.parseInt(id[19], 16) & 0b1100).toBe(0b1000);
  });
});

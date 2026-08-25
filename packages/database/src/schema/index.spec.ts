import { getTableColumns, is } from "drizzle-orm";
import { MySqlTable } from "drizzle-orm/mysql-core";
import { describe, expect, it } from "vitest";
import * as schema from "./index";

const FLOATING = ["MySqlFloat", "MySqlDouble", "MySqlReal"];

// Widened so the predicate below has something to narrow: the union of the
// table types is not `MySqlTable`.
const exported: Record<string, unknown> = schema;

const tables = Object.entries(exported).filter((entry): entry is [string, MySqlTable] =>
  is(entry[1], MySqlTable),
);

// Walked rather than listed, so a column nobody has written yet is covered.
const columns = tables.flatMap(([name, table]) =>
  Object.values(getTableColumns(table)).map((column) => ({
    path: `${name}.${column.name}`,
    columnType: column.columnType,
    dataType: column.dataType,
    notNull: column.notNull,
  })),
);

describe("schema", () => {
  it("should declare no floating point column anywhere", () => {
    // when
    const floating = columns.filter((column) => FLOATING.includes(column.columnType));

    // then
    expect(floating.map((column) => column.path)).toEqual([]);
  });

  it("should hand every decimal column back as a string rather than a number", () => {
    // given
    const decimals = columns.filter((column) => column.columnType.startsWith("MySqlDecimal"));

    // when
    const lossy = decimals.filter((column) => column.dataType !== "string");

    // then
    expect(decimals).not.toHaveLength(0);
    expect(lossy.map((column) => column.path)).toEqual([]);
  });

  it("should declare no nullable timestamp column anywhere", () => {
    // when
    const nullable = columns.filter(
      (column) => column.columnType === "MySqlTimestamp" && !column.notNull,
    );

    // then
    expect(nullable.map((column) => column.path)).toEqual([]);
  });
});

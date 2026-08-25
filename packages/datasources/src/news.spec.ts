import { describe, expect, it } from "vitest";
import { isRedFolder, type NewsEvent, toEvents } from "./news";

// Shapes taken from a real response.
const NFP = {
  title: "Non-Farm Employment Change",
  country: "USD",
  date: "2026-09-04T08:30:00-04:00",
  impact: "High",
};

describe("toEvents", () => {
  it("should give nothing back for an empty calendar", () => {
    // then
    expect(toEvents([])).toEqual([]);
  });

  it("should read the offset rather than the wall clock", () => {
    // given 08:30 in New York during daylight saving
    const [event] = toEvents([NFP]);

    // then
    expect(event?.time).toBe(Date.UTC(2026, 8, 4, 12, 30));
  });

  it("should drop a row with no moment to draw a window around", () => {
    // given the shapes the feed uses for all day and tentative rows
    const rows = [{ ...NFP, date: "" }, { ...NFP, date: "Tentative" }, NFP];

    // then
    expect(toEvents(rows)).toHaveLength(1);
  });

  it("should drop a row missing a title or a currency", () => {
    // then
    expect(
      toEvents([
        { ...NFP, title: "  " },
        { ...NFP, country: undefined },
      ]),
    ).toEqual([]);
  });

  it("should treat an impact it does not know as unknown, never as low", () => {
    // then
    expect(toEvents([{ ...NFP, impact: "Non-Economic" }])[0]?.impact).toBe("unknown");
    expect(toEvents([{ ...NFP, impact: undefined }])[0]?.impact).toBe("unknown");
  });

  it("should read the impact whatever case it arrives in", () => {
    // then
    expect(toEvents([{ ...NFP, impact: "HIGH" }])[0]?.impact).toBe("high");
    expect(toEvents([{ ...NFP, impact: "Holiday" }])[0]?.impact).toBe("holiday");
  });

  it("should sort the calendar by release time", () => {
    // given the later row first
    const rows = [{ ...NFP, date: "2026-09-04T10:00:00-04:00", title: "ISM" }, NFP];

    // then
    expect(toEvents(rows).map((event) => event.title)).toEqual([
      "Non-Farm Employment Change",
      "ISM",
    ]);
  });
});

describe("isRedFolder", () => {
  const event = (over: Partial<NewsEvent>): NewsEvent => ({
    id: "1",
    title: "t",
    time: 0,
    currency: "USD",
    impact: "high",
    ...over,
  });

  it("should take a high impact dollar release", () => {
    // then
    expect(isRedFolder(event({}))).toBe(true);
  });

  it("should leave a high impact release in another currency", () => {
    // then
    expect(isRedFolder(event({ currency: "EUR" }))).toBe(false);
  });

  it("should leave a lesser dollar release", () => {
    // then
    expect(isRedFolder(event({ impact: "medium" }))).toBe(false);
  });
});

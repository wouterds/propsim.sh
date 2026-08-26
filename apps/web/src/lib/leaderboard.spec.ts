import type { RoundTrip } from "@propsim/engine";
import { describe, expect, it } from "vitest";
import {
  bankedSince,
  cutoffOf,
  medianPnlOf,
  profitableShare,
  type Standing,
  spanOr,
} from "./leaderboard";

const trip = (closedAt: string, pnlCents: number): RoundTrip => ({
  instrument: "MNQ",
  side: "buy",
  quantity: 1,
  entry: 21_500_000_000,
  exit: 21_500_000_000,
  pnlCents,
  feeCents: 0,
  openedAt: new Date(closedAt),
  closedAt: new Date(closedAt),
  tradeDate: closedAt.slice(0, 10),
});

const standing = (pnlCents: number): Standing => ({
  userId: "u",
  name: "Amber Badger",
  initials: "AB",
  hue: 12,
  accounts: 1,
  startingCents: 5_000_000,
  pnlCents,
});

describe("spanOr", () => {
  it("should fall back to the shortest span when the address carries nonsense", () => {
    // then
    expect(spanOr("90d")).toBe("7d");
    expect(spanOr(null)).toBe("7d");
  });

  it("should keep a span it knows", () => {
    // then
    expect(spanOr("all")).toBe("all");
  });
});

describe("cutoffOf", () => {
  it("should measure back from now, not from midnight", () => {
    // given
    const now = new Date("2026-08-26T14:30:00Z");

    // then
    expect(cutoffOf("7d", now)?.toISOString()).toBe("2026-08-19T14:30:00.000Z");
  });

  it("should have nothing to measure back from over all time", () => {
    // then
    expect(cutoffOf("all", new Date("2026-08-26T14:30:00Z"))).toBeNull();
  });
});

describe("bankedSince", () => {
  it("should drop a trip that closed before the cutoff", () => {
    // given one inside the window and one a day too old
    const trips = [trip("2026-08-25T15:00:00Z", 40_000), trip("2026-08-18T15:00:00Z", 999_999)];

    // when
    const banked = bankedSince(trips, new Date("2026-08-19T14:30:00Z"));

    // then
    expect(banked).toBe(40_000);
  });

  it("should hold both sides of the cutoff", () => {
    // given trips one millisecond either side of it
    const cutoff = new Date("2026-08-19T14:30:00Z");
    const on = [trip("2026-08-19T14:30:00.000Z", 100)];
    const before = [trip("2026-08-19T14:29:59.999Z", 100)];

    // then a trip closed exactly on the cutoff is inside the window
    expect(bankedSince(on, cutoff)).toBe(100);
    expect(bankedSince(before, cutoff)).toBe(0);
  });

  it("should count everything when there is no cutoff", () => {
    // given
    const trips = [trip("2020-01-01T00:00:00Z", 250), trip("2026-08-25T15:00:00Z", 250)];

    // then
    expect(bankedSince(trips, null)).toBe(500);
  });
});

describe("profitableShare", () => {
  it("should give nothing back when nobody has traded", () => {
    // then
    expect(profitableShare([])).toBeNull();
  });

  it("should count breaking even as unprofitable", () => {
    // given one up, one flat, one down, one up
    const standings = [standing(500), standing(0), standing(-500), standing(1)];

    // then
    expect(profitableShare(standings)).toBe(0.5);
  });
});

describe("medianPnlOf", () => {
  it("should give nothing back when nobody has traded", () => {
    // then
    expect(medianPnlOf([])).toBeNull();
  });

  it("should take the middle of an odd count", () => {
    // then
    expect(medianPnlOf([standing(-100), standing(700), standing(50)])).toBe(50);
  });

  it("should average the two in the middle of an even count", () => {
    // then
    expect(medianPnlOf([standing(-100), standing(700), standing(50), standing(-50)])).toBe(0);
  });
});

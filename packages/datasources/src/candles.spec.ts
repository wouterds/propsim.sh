import { describe, expect, it } from "vitest";
import { type CandleRequest, toCandles } from "./candles";
import type { ChartResult } from "./yahoo";

// 2026-01-05T00:00:00Z, a Monday.
const JAN_05 = 1767571200;
const MINUTE = 60;
const DAY = 86400;

const MINUTELY: CandleRequest = { symbol: "MES=F", interval: "1m", range: "1d" };

type Row = {
  time: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

// A coherent bar around a close, so each case varies one value. Volume is
// derived from the close so rows stay distinguishable.
const solid = (time: number, close: number): Row => ({
  time,
  open: close - 1,
  high: close + 2,
  low: close - 3,
  close,
  volume: close * 10,
});

const chart = (rows: Row[], regularMarketTime: number): ChartResult => ({
  meta: { regularMarketTime },
  timestamp: rows.map((row) => row.time),
  indicators: {
    quote: [
      {
        open: rows.map((row) => row.open),
        high: rows.map((row) => row.high),
        low: rows.map((row) => row.low),
        close: rows.map((row) => row.close),
        volume: rows.map((row) => row.volume),
      },
    ],
  },
});

describe("toCandles", () => {
  it("should throw when nothing in the window has closed yet", () => {
    // given
    const rows = [solid(JAN_05, 100), solid(JAN_05 + MINUTE, 200)];

    // when
    const parse = () => toCandles(chart(rows, JAN_05 + 30), MINUTELY);

    // then
    expect(parse).toThrow("no closed 1m bar");
  });

  it("should throw when Yahoo downgrades an intraday request to daily rows", () => {
    // given
    const fiveMinute: CandleRequest = { symbol: "MES=F", interval: "5m", range: "1mo" };
    const daily = [solid(JAN_05, 100), solid(JAN_05 + DAY, 200), solid(JAN_05 + 2 * DAY, 300)];
    // A weekend sits inside every real intraday series, so only the tightest gap
    // may condemn one and the widest has to be tolerated.
    const weekend = [solid(JAN_05, 100), solid(JAN_05 + 300, 200), solid(JAN_05 + 3 * DAY, 300)];

    // when
    const parse = () => toCandles(chart(daily, JAN_05 + 3 * DAY), fiveMinute);
    const candles = toCandles(chart(weekend, JAN_05 + 3 * DAY + 300), fiveMinute);

    // then
    expect(parse).toThrow("coarser than 5m");
    expect(candles.map((candle) => candle.close)).toEqual([100, 200, 300]);
  });

  it("should throw when a wide range comes back truncated to a single bar", () => {
    // given
    const rows = [solid(JAN_05, 100)];
    const week: CandleRequest = { symbol: "MES=F", interval: "5m", range: "5d" };
    const day: CandleRequest = { ...week, range: "1d" };

    // when
    const parse = () => toCandles(chart(rows, JAN_05 + 300), week);
    const candles = toCandles(chart(rows, JAN_05 + 300), day);

    // then
    expect(parse).toThrow("truncated to one bar");
    expect(candles).toHaveLength(1);
  });

  it("should drop a bar with a null in it rather than filling it", () => {
    // given
    const rows = [
      solid(JAN_05, 100),
      { ...solid(JAN_05 + MINUTE, 200), low: null },
      solid(JAN_05 + 2 * MINUTE, 300),
    ];

    // when
    const candles = toCandles(chart(rows, JAN_05 + 3 * MINUTE), MINUTELY);

    // then
    expect(candles).toHaveLength(2);
    expect(candles[1].close).toBe(300);
    expect(candles[1].time).toBe((JAN_05 + 2 * MINUTE) * 1000);
    expect(candles[1].volume).toBe(3000);
  });

  it("should drop a bar whose wick does not contain its body", () => {
    // given
    const lowAbove = { time: JAN_05 + MINUTE, open: 100, high: 120, low: 115, close: 110 };
    const highBelow = { time: JAN_05 + 2 * MINUTE, open: 100, high: 105, low: 95, close: 110 };
    const rows = [
      solid(JAN_05, 100),
      { ...lowAbove, volume: 5 },
      { ...highBelow, volume: 5 },
      solid(JAN_05 + 3 * MINUTE, 300),
    ];

    // when
    const candles = toCandles(chart(rows, JAN_05 + 4 * MINUTE), MINUTELY);

    // then
    expect(candles.map((candle) => candle.close)).toEqual([100, 300]);
  });

  it("should keep a bar whose open, high, low and close are all equal", () => {
    // given
    const flat = { time: JAN_05, open: 100, high: 100, low: 100, close: 100, volume: 0 };

    // when
    const candles = toCandles(chart([flat], JAN_05 + MINUTE), MINUTELY);

    // then
    expect(candles).toHaveLength(1);
    expect(candles[0].close).toBe(100);
  });

  it("should drop the bar still in progress, and keep it once its interval has closed", () => {
    // given
    const rows = [solid(JAN_05, 100), solid(JAN_05 + MINUTE, 200), solid(JAN_05 + 2 * MINUTE, 300)];
    const midBar = JAN_05 + 2 * MINUTE + 30;
    const onClose = JAN_05 + 3 * MINUTE;

    // when
    const running = toCandles(chart(rows, midBar), MINUTELY);
    const settled = toCandles(chart(rows, onClose), MINUTELY);

    // then
    expect(running.map((candle) => candle.close)).toEqual([100, 200]);
    expect(settled.map((candle) => candle.close)).toEqual([100, 200, 300]);
  });

  it("should keep a bar Yahoo published no volume for", () => {
    // given
    const rows = [{ ...solid(JAN_05, 100), volume: null }];

    // when
    const candles = toCandles(chart(rows, JAN_05 + MINUTE), MINUTELY);

    // then
    expect(candles).toHaveLength(1);
    expect(candles[0].volume).toBe(0);
    expect(candles[0].close).toBe(100);
  });
});

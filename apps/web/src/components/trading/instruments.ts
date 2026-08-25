export type Instrument = {
  /** What the exchange calls it. */
  code: string;
  /** What Yahoo calls it. */
  symbol: string;
  name: string;
  group: "Equity index" | "Metals" | "Energy";
  /** The smallest move the price can make. */
  tick: number;
  /** What one full point of price is worth, in dollars. */
  point: number;
};

// Micros only. Tick sizes and point values are the CME contract specs, and the
// two together give the dollar value of one tick.
export const INSTRUMENTS: Instrument[] = [
  {
    code: "MES",
    symbol: "MES=F",
    name: "Micro S&P 500",
    group: "Equity index",
    tick: 0.25,
    point: 5,
  },
  {
    code: "MNQ",
    symbol: "MNQ=F",
    name: "Micro Nasdaq 100",
    group: "Equity index",
    tick: 0.25,
    point: 2,
  },
  {
    code: "M2K",
    symbol: "M2K=F",
    name: "Micro Russell 2000",
    group: "Equity index",
    tick: 0.1,
    point: 5,
  },
  { code: "MYM", symbol: "MYM=F", name: "Micro Dow", group: "Equity index", tick: 1, point: 0.5 },
  { code: "MGC", symbol: "MGC=F", name: "Micro Gold", group: "Metals", tick: 0.1, point: 10 },
  { code: "SIL", symbol: "SIL=F", name: "Micro Silver", group: "Metals", tick: 0.005, point: 1000 },
  {
    code: "MHG",
    symbol: "MHG=F",
    name: "Micro Copper",
    group: "Metals",
    tick: 0.0005,
    point: 25_000,
  },
  {
    code: "MCL",
    symbol: "MCL=F",
    name: "Micro Crude Oil",
    group: "Energy",
    tick: 0.01,
    point: 100,
  },
  {
    code: "MNG",
    symbol: "MNG=F",
    name: "Micro Natural Gas",
    group: "Energy",
    tick: 0.001,
    point: 2500,
  },
];

export const DEFAULT_CODE = "MNQ";

export const findInstrument = (code: string | null | undefined) =>
  INSTRUMENTS.find((instrument) => instrument.code === code) ?? null;

export const instrumentOr = (code: string | null | undefined) =>
  findInstrument(code) ?? (findInstrument(DEFAULT_CODE) as Instrument);

export const GROUPS = [...new Set(INSTRUMENTS.map((instrument) => instrument.group))];

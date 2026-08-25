import type { JournalDay } from "./journal";

export type Trade = {
  id: string;
  at: number;
  side: "buy" | "sell";
  quantity: number;
  entry: number;
  exit: number;
  pnl: number;
  seconds: number;
};

const POINT = 2;
const TICK = 0.25;

// Seeded from the date, so the same day always tells the same story.
const seedOf = (date: string) => {
  let seed = 2166136261;

  for (let i = 0; i < date.length; i++) {
    seed = Math.imul(seed ^ date.charCodeAt(i), 16777619);
  }

  return seed >>> 0;
};

const randomFrom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const OPEN_MINUTES = 14 * 60 + 30;

/**
 * Invented, but not arbitrary: the trades add up to the day's own profit and
 * loss, and as many of them win as the journal says did.
 */
export const tradesOf = (day: JournalDay): Trade[] => {
  const next = randomFrom(seedOf(day.date));
  const losses = day.trades - day.wins;

  // Split the day across the winners and the losers, so the parts sum to it.
  const share = (count: number, total: number) => {
    const weights = Array.from({ length: count }, () => 0.5 + next());
    const sum = weights.reduce((a, b) => a + b, 0);

    return weights.map((weight) => (total * weight) / sum);
  };

  const won = day.pnl > 0 ? day.pnl + Math.abs(day.worstDrawdown) / 2 : Math.abs(day.pnl) * 0.6;
  const lost = won - day.pnl;

  const wins = share(day.wins, won);
  const downs = share(losses, -lost);
  const amounts = [...wins, ...downs];

  const minutes = [...amounts.keys()].map(() => Math.floor(next() * 380)).sort((a, b) => a - b);

  const day0 = Date.parse(`${day.date}T00:00:00Z`);

  return amounts
    .map((raw, index) => {
      const pnl = Math.round(raw * 4) / 4;
      const quantity = 1 + Math.floor(next() * 3);
      const side = next() > 0.45 ? "buy" : "sell";
      const entry = Math.round((21_500 + next() * 900) / TICK) * TICK;
      const move = pnl / (quantity * POINT);

      return {
        id: `${day.date}-${index}`,
        at: day0 + (OPEN_MINUTES + minutes[index]) * 60_000,
        side: side as Trade["side"],
        quantity,
        entry,
        exit: Math.round((side === "buy" ? entry + move : entry - move) / TICK) * TICK,
        pnl,
        seconds: 30 + Math.floor(next() * 3_000),
      };
    })
    .sort((a, b) => a.at - b.at);
};

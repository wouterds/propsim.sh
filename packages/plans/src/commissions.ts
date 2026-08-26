/**
 * What a fill costs, in whole cents, per side. A round turn is charged twice
 * because both sides are fills.
 *
 * These are the firm's terms rather than the exchange's, so they belong here
 * beside the floors and not in the contract catalog. They also move: a rate is
 * stamped onto the fill it was charged on, so a revision here can never reprice
 * a trade that already happened.
 *
 * Taken from Lucid's published schedule in August 2026. Exchange, clearing and
 * NFA fees sit on top of these at a real firm and are not modelled.
 */
const PER_SIDE: Record<string, number> = {
  MES: 50,
  MNQ: 50,
  M2K: 50,
  MYM: 50,
  MCL: 50,
  MGC: 80,
  SIL: 160,
  // Not published for either. Every micro outside the metals is 50, and the
  // two metals that are published are dearer, so copper is the doubtful one.
  MHG: 50,
  MNG: 50,
};

/** What every micro costs where the schedule says nothing. */
export const DEFAULT_PER_SIDE = 50;

export const feePerSideCents = (instrument: string) => PER_SIDE[instrument] ?? DEFAULT_PER_SIDE;

/** The whole commission on one fill, which is the rate times what it printed. */
export const feeOf = (instrument: string, quantity: number) =>
  feePerSideCents(instrument) * quantity;

export type Plan = {
  id: string;
  label: string;
  size: number;
  profitTarget: number;
  trailingDrawdown: number;
  dailyLossLimit: number;
  maxMinis: number;
  maxMicros: number;
  /** How far above the starting balance the trailing floor stops climbing. */
  lockAboveStart: number;
};

/** The trailing floor stops climbing here, and from then on it never moves. */
const LOCK_ABOVE_START = 100;

/**
 * Modelled on the daily payout accounts the funded firms sell. One family for
 * now: a plan holds the rules and an account holds the state, so a second
 * family is a row here rather than a branch downstream.
 */
export const PLANS: Plan[] = [
  {
    id: "daily-25k",
    label: "25K",
    size: 25_000,
    profitTarget: 1_250,
    trailingDrawdown: 1_000,
    dailyLossLimit: 600,
    maxMinis: 2,
    maxMicros: 20,
    lockAboveStart: LOCK_ABOVE_START,
  },
  {
    id: "daily-50k",
    label: "50K",
    size: 50_000,
    profitTarget: 3_000,
    trailingDrawdown: 2_000,
    dailyLossLimit: 1_200,
    maxMinis: 4,
    maxMicros: 40,
    lockAboveStart: LOCK_ABOVE_START,
  },
  {
    id: "daily-100k",
    label: "100K",
    size: 100_000,
    profitTarget: 6_000,
    trailingDrawdown: 3_000,
    dailyLossLimit: 1_800,
    maxMinis: 6,
    maxMicros: 60,
    lockAboveStart: LOCK_ABOVE_START,
  },
  {
    id: "daily-150k",
    label: "150K",
    size: 150_000,
    profitTarget: 9_000,
    trailingDrawdown: 4_500,
    dailyLossLimit: 2_700,
    maxMinis: 10,
    maxMicros: 100,
    lockAboveStart: LOCK_ABOVE_START,
  },
];

export const lockedFloorOf = (plan: Plan) => plan.size + plan.lockAboveStart;

/** Where the trailing floor stops following a new peak. */
export const trailStopsAt = (plan: Plan) => lockedFloorOf(plan) + plan.trailingDrawdown;

/** The share of total profit one session is allowed to make up. */
export const CONSISTENCY_CAP = 0.5;

export const DEFAULT_PLAN_ID = "daily-50k";

export const findPlan = (id: string | null | undefined) =>
  PLANS.find((plan) => plan.id === id) ?? null;

export const planOr = (id: string | null | undefined) =>
  findPlan(id) ?? findPlan(DEFAULT_PLAN_ID) ?? PLANS[0];

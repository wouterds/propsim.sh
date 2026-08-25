export type Plan = {
  id: string;
  label: string;
  size: number;
  profitTarget: number;
  trailingDrawdown: number;
  dailyLossLimit: number;
  maxMinis: number;
  maxMicros: number;
  minimumDays: number;
};

/**
 * One family for now. A plan holds the rules, an account holds the state, so a
 * second family is a row here rather than a branch downstream.
 */
export const PLANS: Plan[] = [
  {
    id: "daily-25k",
    label: "25K",
    size: 25_000,
    profitTarget: 1_500,
    trailingDrawdown: 1_500,
    dailyLossLimit: 500,
    maxMinis: 3,
    maxMicros: 30,
    minimumDays: 3,
  },
  {
    id: "daily-50k",
    label: "50K",
    size: 50_000,
    profitTarget: 3_000,
    trailingDrawdown: 2_000,
    dailyLossLimit: 1_100,
    maxMinis: 5,
    maxMicros: 50,
    minimumDays: 3,
  },
  {
    id: "daily-100k",
    label: "100K",
    size: 100_000,
    profitTarget: 6_000,
    trailingDrawdown: 3_000,
    dailyLossLimit: 2_200,
    maxMinis: 10,
    maxMicros: 100,
    minimumDays: 3,
  },
  {
    id: "daily-150k",
    label: "150K",
    size: 150_000,
    profitTarget: 9_000,
    trailingDrawdown: 5_000,
    dailyLossLimit: 3_300,
    maxMinis: 15,
    maxMicros: 150,
    minimumDays: 3,
  },
];

export const DEFAULT_PLAN_ID = "daily-50k";

export const findPlan = (id: string | null | undefined) =>
  PLANS.find((plan) => plan.id === id) ?? null;

export const planOr = (id: string | null | undefined) =>
  findPlan(id) ?? findPlan(DEFAULT_PLAN_ID) ?? PLANS[0];

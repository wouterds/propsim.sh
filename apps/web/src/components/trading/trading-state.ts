import type { OrderStatus, Side } from "@propsim/engine";

export type OrderType = "market" | "limit" | "stop";

export type OrderDraft = {
  side: Side;
  quantity: number;
  type: OrderType;
  limitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
};

/** What the blotter draws. Prices are in dollars: everything here is display. */
export type Order = {
  id: string;
  placedAt: number;
  side: Side;
  type: OrderType;
  quantity: number;
  price: number;
  status: OrderStatus;
};

/** One net position per contract, so the id is the contract's code. */
export type Position = {
  id: string;
  openedAt: number;
  side: Side;
  quantity: number;
  entry: number;
  stopLoss: number | null;
  takeProfit: number | null;
};

const direction = (side: Side) => (side === "buy" ? 1 : -1);

export const unrealisedPnl = (position: Position, last: number, point: number) =>
  (last - position.entry) * direction(position.side) * position.quantity * point;

/** Null, not a negative, when the stop is the wrong side of entry. That is an instant fill. */
export const riskOf = (draft: OrderDraft, entry: number | null, point: number) => {
  if (entry === null || draft.stopLoss === null) return null;

  const adverse = (entry - draft.stopLoss) * direction(draft.side);

  if (adverse <= 0) return null;

  return adverse * draft.quantity * point;
};

export const rewardOf = (draft: OrderDraft, entry: number | null, point: number) => {
  if (entry === null || draft.takeProfit === null) return null;

  const favourable = (draft.takeProfit - entry) * direction(draft.side);

  if (favourable <= 0) return null;

  return favourable * draft.quantity * point;
};

export const rrRatio = (risk: number | null, reward: number | null) => {
  if (risk === null || reward === null || risk === 0) return null;

  return reward / risk;
};

export const notionalOf = (quantity: number, price: number | null, point: number) => {
  if (price === null) return null;

  return quantity * price * point;
};

export const fillPriceFor = (draft: OrderDraft, last: number) => {
  if (draft.type === "market") return last;

  return draft.limitPrice ?? last;
};

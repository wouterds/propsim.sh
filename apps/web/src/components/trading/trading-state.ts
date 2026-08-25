export type Side = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop";
export type OrderStatus = "filled" | "working" | "cancelled";

export type OrderDraft = {
  side: Side;
  quantity: number;
  type: OrderType;
  limitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
};

export type Order = {
  id: string;
  placedAt: number;
  side: Side;
  type: OrderType;
  quantity: number;
  price: number;
  status: OrderStatus;
};

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

const opposite = (side: Side): Side => (side === "buy" ? "sell" : "buy");

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

export type TradingState = {
  positions: Position[];
  orders: Order[];
  realised: number;
};

export const INITIAL_STATE: TradingState = { positions: [], orders: [], realised: 0 };

export type TradingAction =
  | { kind: "submit"; id: string; at: number; draft: OrderDraft; last: number }
  | { kind: "cancel"; id: string }
  | { kind: "close"; id: string; at: number; last: number; point: number };

const submit = (state: TradingState, action: Extract<TradingAction, { kind: "submit" }>) => {
  const { draft, last, at, id } = action;
  const price = fillPriceFor(draft, last);
  const resting = draft.type !== "market";

  const order: Order = {
    id,
    placedAt: at,
    side: draft.side,
    type: draft.type,
    quantity: draft.quantity,
    price,
    status: resting ? "working" : "filled",
  };

  // Resting orders never fill. Nothing here watches the tape.
  if (resting) {
    return { ...state, orders: [order, ...state.orders] };
  }

  const position: Position = {
    id,
    openedAt: at,
    side: draft.side,
    quantity: draft.quantity,
    entry: price,
    stopLoss: draft.stopLoss,
    takeProfit: draft.takeProfit,
  };

  return { ...state, orders: [order, ...state.orders], positions: [position, ...state.positions] };
};

const close = (state: TradingState, action: Extract<TradingAction, { kind: "close" }>) => {
  const position = state.positions.find((open) => open.id === action.id);

  if (!position) return state;

  const exit: Order = {
    id: `${position.id}-x`,
    placedAt: action.at,
    side: opposite(position.side),
    type: "market",
    quantity: position.quantity,
    price: action.last,
    status: "filled",
  };

  return {
    positions: state.positions.filter((open) => open.id !== action.id),
    orders: [exit, ...state.orders],
    realised: state.realised + unrealisedPnl(position, action.last, action.point),
  };
};

const cancel = (state: TradingState, id: string) => ({
  ...state,
  orders: state.orders.map((order) => {
    if (order.id !== id || order.status !== "working") return order;

    return { ...order, status: "cancelled" as const };
  }),
});

export const reduceTrading = (state: TradingState, action: TradingAction): TradingState => {
  if (action.kind === "submit") return submit(state, action);
  if (action.kind === "close") return close(state, action);

  return cancel(state, action.id);
};

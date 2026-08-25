export type OrderEnd = "cancelled" | "replaced" | "expired";

export type OrderStatus = "working" | "partial" | "filled" | OrderEnd;

export type OrderFacts = {
  quantity: number;
  endedReason: OrderEnd | null;
};

/**
 * The fills decide. `endedReason` records a decision the stream cannot hold, so
 * it only speaks for an order the stream has not already finished.
 */
export const statusOf = (order: OrderFacts, filled: number): OrderStatus => {
  if (filled >= order.quantity) return "filled";
  if (order.endedReason) return order.endedReason;
  if (filled > 0) return "partial";

  return "working";
};

export const isWorking = (status: OrderStatus) => status === "working" || status === "partial";

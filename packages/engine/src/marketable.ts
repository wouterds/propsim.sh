import type { Side } from "./fills";

export type Restable = {
  side: Side;
  type: "limit" | "stop";
  /** Price units, see PRICE_SCALE. */
  price: number;
};

/**
 * Where an order fills the moment it is placed, or null when it has to wait for
 * the tape to come to it.
 *
 * A limit priced on the wrong side of the market is marketable on arrival: a
 * buy limit above the offer and a sell limit below the bid are both instructions
 * to take what is there. A stop the price has already passed has triggered.
 * Every broker fills these on submission, and leaving them to the next sweep
 * shows the trader an order resting at a level the tape has already gone by.
 *
 * It fills at the mark rather than at the level asked for, which is never worse
 * than the order and is the price the trader was being shown.
 */
export const marketableAt = (order: Restable, mark: number): number | null => {
  const takesWhatIsThere =
    order.type === "limit"
      ? (order.side === "buy" && mark <= order.price) ||
        (order.side === "sell" && mark >= order.price)
      : (order.side === "buy" && mark >= order.price) ||
        (order.side === "sell" && mark <= order.price);

  return takesWhatIsThere ? mark : null;
};

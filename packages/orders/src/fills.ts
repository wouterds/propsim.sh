import { fills, type Tx } from "@propsim/database";
import { type Side, tradeDateOf } from "@propsim/engine";

export type FillWrite = {
  accountId: string;
  orderId: string;
  instrument: string;
  side: Side;
  quantity: number;
  /** Price units, see PRICE_SCALE. */
  price: number;
  at: Date;
};

/**
 * The one place a fill row is built, so the web app and the matcher cannot
 * disagree about what a fill is. The session it printed under is cut from the
 * instant it printed at, never from the clock of whatever wrote it.
 */
export const writeFill = (tx: Tx, fill: FillWrite) =>
  tx.insert(fills).values({ ...fill, tradeDate: tradeDateOf(fill.at) });

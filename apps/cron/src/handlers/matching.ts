import { getCandles } from "@propsim/datasources";
import { contractOf, matchesOf } from "@propsim/engine";
import { fillResting, listResting } from "@propsim/orders";

/**
 * Fills the orders the tape reached while nobody was looking. Only contracts
 * somebody is actually resting an order in are asked for, so an empty book
 * costs no upstream request at all.
 */
export const matching = async () => {
  const resting = await listResting();
  let filled = 0;

  for (const instrument of new Set(resting.map((order) => order.instrument))) {
    const orders = resting.filter((order) => order.instrument === instrument);

    let candles: Awaited<ReturnType<typeof getCandles>>;

    try {
      // Five days, not one. A sweep that was down over a weekend still finds
      // the bar that reached the order, and a shut market still answers.
      candles = await getCandles({
        symbol: contractOf(instrument).symbol,
        interval: "1m",
        range: "5d",
      });
    } catch (error) {
      // One contract must not stop the sweep reaching the rest.
      console.error(`matching skipped ${instrument}`, error);
      continue;
    }

    // Written one at a time. Each is its own transaction, so a fill that lands
    // is kept whatever the next one does, including a duplicate key from a
    // second sweep that reached the same bar.
    for (const match of matchesOf(orders, candles)) {
      try {
        if (await fillResting(match)) {
          filled += 1;
        }
      } catch (error) {
        console.error(`matching skipped order ${match.order.id}`, error);
      }
    }
  }

  if (filled) {
    console.log(`matching filled ${filled} order${filled === 1 ? "" : "s"}`);
  }
};

import { type Candle, getCandles } from "@propsim/datasources";
import {
  carriedInOf,
  contractOf,
  type Ledger,
  ledgerOf,
  markingOf,
  type NetPosition,
  peakOf,
  positionsOf,
  tradeDateOf,
} from "@propsim/engine";
import {
  findTradingDay,
  flatten,
  listFills,
  listLive,
  rulesOf,
  settle,
  touchTradingDay,
} from "@propsim/orders";

type Held = { id: string; ledger: Ledger; positions: NetPosition[]; opened: number };

/**
 * The book only holds still between two prints, so a bar from before the last
 * fill belongs to a position that no longer exists. Earlier sessions are left
 * alone as well: their floors were measured from an anchor that has closed.
 */
const readable = (bars: Candle[], held: Held, tradeDate: string) =>
  bars.filter((bar) => bar.time >= held.opened && tradeDateOf(new Date(bar.time)) === tradeDate);

const holdingsOf = async (row: Awaited<ReturnType<typeof listLive>>[number]) => {
  const ledger = ledgerOf(await listFills(row.id), row.startingBalanceCents);
  const positions = positionsOf(ledger);

  if (positions.length === 0) {
    return null;
  }

  return { id: row.id, ledger, positions, opened: ledger.path.at(-1)?.at.getTime() ?? 0 };
};

/**
 * Marks every open position against the tape and flattens the accounts it took
 * through a floor. Without it a floor is only ever tested when a fill happens
 * to land, so a position that ran through one and came back was never seen to
 * have broken anything.
 */
export const marking = async () => {
  const rows = await listLive();
  const held = (await Promise.all(rows.map(holdingsOf))).filter((one) => one !== null);

  if (held.length === 0) {
    return;
  }

  const now = new Date();
  const tradeDate = tradeDateOf(now);
  const wanted = new Set(held.flatMap((one) => one.positions.map((open) => open.instrument)));
  const tape = new Map<string, Candle[]>();

  // Once per contract, however many accounts are holding it.
  for (const instrument of wanted) {
    try {
      tape.set(
        instrument,
        await getCandles({ symbol: contractOf(instrument).symbol, interval: "1m", range: "5d" }),
      );
    } catch (error) {
      // One contract must not stop the sweep reaching the rest.
      console.error(`marking skipped ${instrument}`, error);
    }
  }

  let liquidated = 0;

  for (const one of held) {
    try {
      const row = rows.find((account) => account.id === one.id);

      if (!row) {
        continue;
      }

      const bars = new Map(
        one.positions.flatMap((open) => {
          const found = tape.get(open.instrument);

          return found ? [[open.instrument, readable(found, one, tradeDate)] as const] : [];
        }),
      );

      const day = await findTradingDay(one.id, tradeDate);
      const sessionOpenCents = day?.openEquityCents ?? carriedInOf(one.ledger, tradeDate);
      const peakEquityCents = Math.max(row.peakEquityCents, peakOf(one.ledger));

      const { lowEquityCents, liquidation } = markingOf(one.ledger, bars, rulesOf(row), {
        peakEquityCents,
        sessionOpenCents,
      });

      await touchTradingDay(one.id, tradeDate, now, {
        openEquityCents: sessionOpenCents,
        lowEquityCents,
      });

      if (!liquidation) {
        continue;
      }

      // A contract the tape said nothing about is closed where it last printed,
      // which is the mark the breach was read at.
      const marks = new Map([...one.ledger.marks, ...liquidation.marks]);

      await flatten(one.id, one.positions, marks, liquidation.at);
      await settle(one.id, liquidation.at);
      liquidated += 1;
    } catch (error) {
      console.error(`marking skipped account ${one.id}`, error);
    }
  }

  if (liquidated) {
    console.log(`marking liquidated ${liquidated} account${liquidated === 1 ? "" : "s"}`);
  }
};

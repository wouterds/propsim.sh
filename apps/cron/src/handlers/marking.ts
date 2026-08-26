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

type LiveAccount = Awaited<ReturnType<typeof listLive>>[number];

type Held = {
  account: LiveAccount;
  ledger: Ledger;
  positions: NetPosition[];
  /** The last print, after which the book stopped changing. */
  opened: number;
};

/**
 * The book only holds still between two prints, so a bar from before the last
 * fill belongs to a position that no longer exists. Earlier sessions are left
 * alone as well: their floors were measured from an anchor that has closed.
 */
const readable = (bars: Candle[], opened: number, tradeDate: string) =>
  bars.filter((bar) => bar.time >= opened && tradeDateOf(new Date(bar.time)) === tradeDate);

const holdingsOf = async (account: LiveAccount): Promise<Held | null> => {
  const ledger = ledgerOf(await listFills(account.id), account.startingBalanceCents);
  const positions = positionsOf(ledger);

  if (positions.length === 0) {
    return null;
  }

  return { account, ledger, positions, opened: ledger.path.at(-1)?.at.getTime() ?? 0 };
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
      const bars = new Map(
        one.positions.flatMap((open) => {
          const found = tape.get(open.instrument);

          return found ? [[open.instrument, readable(found, one.opened, tradeDate)] as const] : [];
        }),
      );

      const day = await findTradingDay(one.account.id, tradeDate);
      const sessionOpenCents = day?.openEquityCents ?? carriedInOf(one.ledger, tradeDate);
      const peakEquityCents = Math.max(one.account.peakEquityCents, peakOf(one.ledger));

      const { lowEquityCents, liquidation } = markingOf(
        one.ledger,
        bars,
        rulesOf(one.account),
        peakEquityCents,
      );

      await touchTradingDay(one.account.id, tradeDate, now, {
        openEquityCents: sessionOpenCents,
        lowEquityCents,
      });

      if (!liquidation) {
        continue;
      }

      // A contract the tape said nothing about is closed where it last printed,
      // which is the mark the breach was read at.
      const marks = new Map([...one.ledger.marks, ...liquidation.marks]);

      await flatten(one.account.id, one.positions, marks, liquidation.at);
      await settle(one.account.id, liquidation.at);
      liquidated += 1;
    } catch (error) {
      console.error(`marking skipped account ${one.account.id}`, error);
    }
  }

  if (liquidated) {
    console.log(`marking liquidated ${liquidated} account${liquidated === 1 ? "" : "s"}`);
  }
};

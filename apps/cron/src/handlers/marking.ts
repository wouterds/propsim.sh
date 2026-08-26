import { type Candle, getCandles, getNewsEvents, isRedFolder } from "@propsim/datasources";
import {
  carriedInOf,
  contractOf,
  type Fill,
  heldThroughOf,
  type Ledger,
  ledgerOf,
  markingOf,
  type NetPosition,
  peakOf,
  positionsOf,
  tradeDateOf,
  windowsOf,
} from "@propsim/engine";
import {
  failForNews,
  findTradingDay,
  flatten,
  listFills,
  listLive,
  rulesOf,
  settle,
  touchTradingDay,
} from "@propsim/orders";

type LiveAccount = Awaited<ReturnType<typeof listLive>>[number];

type Watched = {
  account: LiveAccount;
  fills: Fill[];
  ledger: Ledger;
  positions: NetPosition[];
  /** The last print, after which the book stopped changing. */
  opened: number;
};

/** The calendar the blackout windows are cut from, red folder releases only. */
const redFolderWindows = async () => {
  const events = await getNewsEvents();

  return windowsOf(
    events.filter(isRedFolder).map((event) => ({ time: event.time, title: event.title })),
  );
};

/**
 * The book only holds still between two prints, so a bar from before the last
 * fill belongs to a position that no longer exists. Earlier sessions are left
 * alone as well: their floors were measured from an anchor that has closed.
 */
const readable = (bars: Candle[], opened: number, tradeDate: string) =>
  bars.filter((bar) => bar.time >= opened && tradeDateOf(new Date(bar.time)) === tradeDate);

const watchedOf = async (account: LiveAccount): Promise<Watched> => {
  const fills = await listFills(account.id);
  const ledger = ledgerOf(fills, account.startingBalanceCents);

  return {
    account,
    fills,
    ledger,
    positions: positionsOf(ledger),
    opened: ledger.path.at(-1)?.at.getTime() ?? 0,
  };
};

/**
 * Marks every open position against the tape and flattens the accounts it took
 * through a floor. Without it a floor is only ever tested when a fill happens
 * to land, so a position that ran through one and came back was never seen to
 * have broken anything.
 */
export const marking = async () => {
  const rows = await listLive();

  if (rows.length === 0) {
    return;
  }

  const watched = await Promise.all(rows.map(watchedOf));
  const now = new Date();
  const tradeDate = tradeDateOf(now);

  // One contract must not stop the sweep, and neither must the calendar. A
  // feed that is down leaves the floors judged and the releases unjudged.
  let windows: Awaited<ReturnType<typeof redFolderWindows>> = [];

  try {
    windows = await redFolderWindows();
  } catch (error) {
    console.error("marking read no calendar", error);
  }

  const held = watched.filter((one) => one.positions.length > 0);
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
  let failed = 0;

  // Every account, not only the ones holding something now. A position carried
  // through a release is a breach the account keeps after it is closed.
  for (const one of watched) {
    try {
      const through = heldThroughOf(one.fills, windows, now.getTime());

      if (through) {
        await failForNews(one.account.id, through.titles.join(", "), through.at);
        failed += 1;
        continue;
      }

      if (one.positions.length === 0) {
        continue;
      }

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

  if (liquidated || failed) {
    console.log(`marking liquidated ${liquidated} and failed ${failed} on the calendar`);
  }
};

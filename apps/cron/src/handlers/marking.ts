import { getTape } from "@propsim/datasources";
import {
  carriedInOf,
  closeStepOf,
  contractOf,
  type Fill,
  heldThroughOf,
  type Ledger,
  ledgerOf,
  markingOf,
  type NetPosition,
  type Printed,
  peakOf,
  positionsOf,
  priceUnits,
  revealedOf,
  tradeDateOf,
} from "@propsim/engine";
import {
  failForNews,
  findTradingDay,
  flatten,
  listFills,
  listLive,
  raisePeak,
  rulesOf,
  settle,
  touchTradingDay,
} from "@propsim/orders";
import { redFolderWindows } from "~/calendar";

type LiveAccount = Awaited<ReturnType<typeof listLive>>[number];

type Watched = {
  account: LiveAccount;
  fills: Fill[];
  ledger: Ledger;
  positions: NetPosition[];
  /** The last print, after which the book stopped changing. */
  opened: number;
};

/**
 * The book only holds still between two prints, so a bar from before the last
 * fill belongs to a position that no longer exists. Earlier sessions are left
 * alone as well: their floors were measured from an anchor that has closed.
 * Nothing past the close is read either, because the position is flattened
 * there.
 */
const readable = (bars: Printed[], opened: number, tradeDate: string, until: number) =>
  bars.filter(
    (bar) =>
      bar.time >= opened && bar.time < until && tradeDateOf(new Date(bar.time)) === tradeDate,
  );

/**
 * The close, if the tape has shown it since the last print, and the marks to
 * flatten at: each contract where it last printed inside the session.
 */
const closeOf = (one: Watched, tape: Map<string, Printed[]>) => {
  const closes = one.positions.flatMap((open) => {
    const found = closeStepOf(tape.get(open.instrument) ?? [], one.opened);

    return found ? [{ instrument: open.instrument, ...found }] : [];
  });

  // Every contract, or none. A tape a step behind would be closed at its last
  // fill, and the close is certain to arrive on the next sweep.
  if (closes.length < one.positions.length) {
    return null;
  }

  const at = Math.min(...closes.map((close) => close.at));
  const marks = new Map(one.ledger.marks);

  for (const close of closes) {
    if (close.last) {
      marks.set(close.instrument, priceUnits(close.last.close));
    }
  }

  return { at, marks };
};

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
  const tape = new Map<string, Printed[]>();

  // Once per contract, however many accounts are holding it.
  for (const instrument of wanted) {
    try {
      const contract = contractOf(instrument);
      const read = await getTape({ symbol: contract.symbol, interval: "1m", range: "5d" });

      // The same steps the matcher reads and the chart drew, so a floor is only
      // ever crossed at a moment the trader watched go by.
      tape.set(instrument, revealedOf(read.candles, read.at, contract.tick));
    } catch (error) {
      // One contract must not stop the sweep reaching the rest.
      console.error(`marking skipped ${instrument}`, error);
    }
  }

  // The tape's own frontier, which is where an open position has actually been
  // marked to. Real time runs about ten minutes ahead of it, and judging a
  // release there ends an account for a window it has not been shown. A tape
  // that said nothing reads as 0 and so reaches no window at all.
  const tapeNow = [...tape.values()].reduce(
    (latest, bars) => Math.max(latest, bars.at(-1)?.time ?? 0),
    0,
  );

  let liquidated = 0;
  let failed = 0;
  let closed = 0;

  // Every account, not only the ones holding something now. A position carried
  // through a release is a breach the account keeps after it is closed.
  for (const one of watched) {
    try {
      const close = one.positions.length === 0 ? null : closeOf(one, tape);
      // Flat from the close, so a release after it was not held through.
      const through = heldThroughOf(one.fills, windows, Math.min(tapeNow, close?.at ?? tapeNow));

      if (through) {
        await failForNews(one.account.id, through.titles.join(", "), through.at);
        failed += 1;
        continue;
      }

      if (one.positions.length === 0) {
        continue;
      }

      const until = close?.at ?? Number.POSITIVE_INFINITY;
      const bars = new Map(
        one.positions.flatMap((open) => {
          const found = tape.get(open.instrument);

          return found
            ? [[open.instrument, readable(found, one.opened, tradeDate, until)] as const]
            : [];
        }),
      );

      const day = await findTradingDay(one.account.id, tradeDate);
      const sessionOpenCents = day?.openEquityCents ?? carriedInOf(one.ledger, tradeDate);
      const peakBefore = Math.max(one.account.peakEquityCents, peakOf(one.ledger));

      const { lowEquityCents, peakEquityCents, liquidation } = markingOf(
        one.ledger,
        bars,
        rulesOf(one.account),
        peakBefore,
      );

      await touchTradingDay(one.account.id, tradeDate, now, {
        openEquityCents: sessionOpenCents,
        lowEquityCents,
      });

      // A rally between two prints raises the floor, so the mark has to survive
      // the sweep that read it. Left here, the next sweep starts from the last
      // fill again and the floor forgets every high the position ever saw.
      await raisePeak(one.account.id, peakEquityCents);

      if (liquidation) {
        // A contract the tape said nothing about is closed where it last printed,
        // which is the mark the breach was read at.
        const marks = new Map([...one.ledger.marks, ...liquidation.marks]);

        await flatten(one.account.id, one.positions, marks, liquidation.at);
        await settle(one.account.id, liquidation.at);
        liquidated += 1;
        continue;
      }

      // Flat at the close, which is not a breach. Stamped on the close step
      // itself, so the fill sits where the trader watched the session shut.
      if (close) {
        const at = new Date(close.at);

        await flatten(one.account.id, one.positions, close.marks, at);
        await settle(one.account.id, at);
        closed += 1;
      }
    } catch (error) {
      console.error(`marking skipped account ${one.account.id}`, error);
    }
  }

  if (liquidated || failed || closed) {
    console.log(
      `marking liquidated ${liquidated}, failed ${failed} on the calendar and closed ${closed}`,
    );
  }
};

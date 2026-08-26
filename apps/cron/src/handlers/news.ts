import { BATCH, sendNewsWarning } from "@propsim/mail";
import { emailsSent } from "@propsim/mail/log";
import { chicagoClock, chicagoDate, listAtRisk } from "@propsim/orders";
import { redFolderWindows } from "~/calendar";

const MINUTE = 60_000;

/** How far ahead the notice goes out. */
const AHEAD = 60 * MINUTE;

/**
 * Under this there is no time left to act on it, and a notice that lands while
 * somebody is already deciding whether to close is worse than none.
 */
const TOO_LATE = 10 * MINUTE;

/** Far enough back to see every notice this run could be about to repeat. */
const LOOKBACK = 2 * AHEAD;

type Sent = { recipient: string; payload: unknown };

/** The release time in milliseconds, which is the only thing that names a window exactly. */
const keyOf = (recipient: string, release: number) => `${recipient}:${release}`;

const alreadyTold = (rows: Sent[]) => {
  const told = new Set<string>();

  for (const row of rows) {
    const release = (row.payload as { release?: number } | null)?.release;

    if (typeof release === "number") {
      told.add(keyOf(row.recipient, release));
    }
  }

  return told;
};

/**
 * Warns everyone holding an account that a red folder release is coming, up to
 * an hour ahead and never inside the last ten minutes. The rule ends an account
 * rather than a day, and the terminal only says so to somebody who happens to
 * be looking at it.
 *
 * One upstream read for the calendar, one query for the addresses, one for what
 * has already gone out, and one request per batch of fifty. The log is the
 * record of who was told, so nothing is told twice and no column tracks it.
 */
export const news = async () => {
  const windows = await redFolderWindows();
  const opening = (window: { from: number }) => window.from - Date.now();
  const due = windows.filter((window) => opening(window) <= AHEAD && opening(window) > TOO_LATE);

  if (due.length === 0) {
    return;
  }

  const [recipients, sent] = await Promise.all([
    listAtRisk(),
    emailsSent("news-warning", new Date(Date.now() - LOOKBACK)),
  ]);

  const told = alreadyTold(sent);
  let warned = 0;

  for (const window of due) {
    const pending = recipients.filter((to) => !told.has(keyOf(to, window.at)));
    const notice = {
      releases: window.titles,
      at: chicagoClock(window.at),
      date: chicagoDate(window.at),
      opens: chicagoClock(window.from),
      closes: chicagoClock(window.to),
    };

    for (let from = 0; from < pending.length; from += BATCH) {
      // Checked per batch, not once at the top. A long enough run crosses the
      // line partway through, and the addresses after it are better left alone.
      if (opening(window) <= TOO_LATE) {
        console.error(`news dropped ${pending.length - from} addresses, too close to the release`);
        break;
      }

      try {
        const refused = await sendNewsWarning(pending.slice(from, from + BATCH), notice, {
          release: window.at,
        });

        warned += Math.min(BATCH, pending.length - from) - refused.length;

        for (const one of refused) {
          console.error(`news refused ${one.to}: ${one.reason}`);
        }
      } catch (error) {
        // One batch failing outright must not stop the rest reaching theirs.
        console.error(`news batch failed at ${from}`, error);
      }
    }
  }

  if (warned) {
    console.log(`news warned ${warned} of ${recipients.length}`);
  }
};

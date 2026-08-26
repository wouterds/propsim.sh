# The Rules

What the simulator enforces, how each rule is measured, and where it lives. Read this before
touching anything in `packages/engine`, because most of these rules are silent: getting one wrong
produces numbers that look right and are not.

## What Is Being Modelled

A **daily payout funded account**, the shape sold as LucidDaily, Topstep Express and their
equivalents. Every number in `packages/plans` was checked against Lucid Trading's published
LucidDaily terms in August 2026 and matches them exactly:

| | 25K | 50K | 100K | 150K |
| --- | --- | --- | --- | --- |
| Profit target | 1,250 | 3,000 | 6,000 | 9,000 |
| Max loss limit (trailing) | 1,000 | 2,000 | 3,000 | 4,500 |
| Daily loss limit | 600 | 1,200 | 1,800 | 2,700 |
| Max minis / micros | 2 / 20 | 4 / 40 | 6 / 60 | 10 / 100 |
| Trailing stops climbing at | 26,100 | 52,100 | 103,100 | 154,600 |

The funded phase of that product uses an **intraday** trailing drawdown against **peak equity**,
including open trade profit. The evaluation phase lets the buyer pick end-of-day instead. Only the
intraday reading is modelled, because it is what a funded account always uses.

## The Two Floors Are Not The Same Rule

This is the mistake the codebase actually made, and the one to keep watching for.

| | Daily loss limit | Trailing drawdown |
| --- | --- | --- |
| Measured from | the equity the session opened on | the highest equity ever reached |
| Resets | every session, at 17:00 CT | never |
| Moves | fixed for the session | up only, and stops at start + 100 |
| Hitting it | **shuts the session** | **ends the account** |
| Flattens the position | no | yes |
| Engine | `lockedOutOf` | `failedOf` |

**The daily floor never ends an account.** It is a soft breach at every firm that sells these: the
trader is locked out until the next session and the account is untouched. An account can be shut
for the day while sitting thousands above its trailing floor, and it can fail on the trailing floor
without ever having had a bad enough day to be locked out. They are independent outcomes, which is
why there is no single function returning one of them.

`accounts.ended_reason` still carries `daily_loss` for rows written before this was fixed. Nothing
writes it.

### The lock is derived, never stored

A session is shut when `trading_days.low_equity_cents <= open_equity_cents - daily_loss_limit_cents`.
Both numbers are already on the row, so there is no lock column to drift, and the lock lifts by
itself when the next session writes its own row.

The low is a ratchet written with `LEAST`, so a session that went through the floor and recovered
stays shut for the rest of the day. That is the rule, not an accident of the storage.

### What a shut session refuses

Nothing that grows the position. A ticket is refused when it would increase the net size, and a
resting **entry** order will not print into a shut session. A **bracket** still fills, because it
only ever reduces a position the account already holds, and cancelling a working stop would raise
the risk rather than lower it.

Closing is always allowed. Refusing it would trap a trader in the trade that shut them.

## The Trailing Floor

`trailingFloorOf` is `min(peak - drawdown, start + lockAboveStart)`. It follows the peak up, never
comes back down, and stops moving once it reaches 100 above the starting balance. Reaching that
point is the whole game, and it is why `lockAboveStart` is snapshotted onto the account rather than
read from the plan catalog.

Both floors are read at **the deepest the equity went**, not where it settled. A position that
breached intraday and closed green has still breached.

### Liquidation

Only the trailing floor flattens anything. The floor is crossed somewhere inside a bar, and a bar
says nothing about the order its range printed in, so `liquidationMarksOf` takes every open contract
the same fraction of the way to its own worst price and solves for the point where equity meets the
floor. One contract open on its own gives exactly the price that puts equity on the floor.

Filling at the bar's extreme would be harsher than the trigger. Filling at the close would let a
spike through the floor survive. Neither is a reading of what happened.

## Red Folder News

Flat from `BEFORE_MINUTES` before a high impact release until `AFTER_MINUTES` after it. Holding a
position through that window is a **hard breach** that ends the account, and opening one inside it
counts the same: the rule is to be flat, not to finish the window in profit.

`heldSpansOf` folds the stretches the account was not flat straight off the fill stream. Flat means
flat across every contract, not just the one that last printed. Going flat and opening again is two
stretches, never one, or the flat gap between them reads as time held.

Nothing is flattened for this breach. The position **is** the breach, so closing it would rewrite
what the account was holding when the release printed.

The account is not stopped from opening inside the window. Refusing the ticket would hide the rule
this whole thing exists to teach.

## Commission

Charged **per side**, so a round turn pays twice, taken from Lucid's published
schedule. Micros are 50 cents a side, micro gold 80, micro silver 160.

It comes out of the balance, so it reaches equity, so **both floors and the
profit target read it**. A round turn at the 40 micro cap on a 50K spends $40 of
a $1,200 daily limit before the trade is right or wrong about anything.

The rate is **stamped onto the fill** as `fills.fee_cents`, worked out inside
`writeFill` so no caller can write a free one. It is not derived at fold time
and not snapshotted onto the account: a commission is a fact about a print, the
same way `trade_date` is, and a revision to the schedule must never reprice a
trade that already happened. Rows written before there were any carry zero,
which is what they cost.

`RoundTrip.pnlCents` stays the price movement. `feeCents` beside it carries both
sides for the contracts that trip closed, taken from the lot's own rate, so a
first in first out close pays what its own entry was charged rather than an
average. The screen subtracts one from the other.

Exchange, clearing and NFA fees sit on top of this at a real firm and are not
modelled.

## The Session

Cut at **17:00 CT**, read off a Chicago wall clock rather than by shifting the instant, so the two
days a year that run 23 or 25 hours still cut in the same place.

A session opens on where the previous one left the equity, never on where the account stands now. An
account holding a position across the roll would otherwise move its own daily floor overnight.

## Not Enforced

Listed so nobody assumes otherwise. Each is published on `/rules` and does nothing.

| Rule | Why not |
| --- | --- |
| **16:45 ET flatten** | Nothing closes a position at the session close, and no order is ever marked `expired`, though the status exists. Explicitly not a breach at any firm, so this is fidelity rather than correctness |
| **Consistency, 50%** | Tints a journal row and gates a payout. It is not a floor that ends an account, so the retroactivity argument for snapshotting it onto the account does not reach it |
| **Hedging across accounts** | Needs more than one account in view, and the ban is about manufacturing a payout rather than about a single account's risk |
| **Microscalping, HFT** | Both are flags for a human at a real firm, not automatic breaches |
| **Position limits** | Only `maxMicros` is checked. `maxMinis` is unenforced, which is currently equivalent because the contract catalog is micros only |
| **Daily profit ceiling** | Lucid moves a trader to live on hitting it. There is nothing to be moved to here |
| **Slippage and the queue** | A limit fills wherever the tape reached it, with nothing in front of it. With commission modelled this is the last place the simulator is kinder than a broker |

## One Clock: The Tape's

The feed runs about **ten to twelve minutes behind**. Every rule is read on the
tape's clock and never on the wall clock, because the tape is the only thing the
trader can see.

A manual fill is stamped at the **open of the bar its price came from**, which is
where the matcher stamps its own fills, so a click and a filled resting order
speak the same instant. Stamping a click at `Date.now()` puts a ten minute old
price under a fresh timestamp, and then:

- A blackout window judged on the wall clock covers bars the trader has not been
  shown. They are ended for a release that, on their chart, has not happened,
  and are then free to trade the spike when it arrives ten minutes later. The
  rule is inverted rather than merely offset.
- A resting order cannot be filled by any bar for ten minutes, because every bar
  the feed still owes is older than the order's own `placed_at`.
- A trade near 17:00 CT is stamped into the next session while carrying the
  previous session's price.

`heldThroughOf` takes `asOf`, which is the tape's frontier: the newest bar the
sweep actually read. A silent tape reads as 0 and reaches no window, so a feed
outage never breaches anybody.

## Known Fidelity Limits

- **Bars, not ticks.** The floors are read against one minute bars from a delayed feed, so a floor
  crossed and recovered inside a single bar is caught by the bar's low, but the exact instant is not
  known. `/rules` says "every tick"; the truth is every bar.
- **The calendar reaches back a week.** A release older than the news feed's window cannot be
  judged, so a news breach is only ever caught close to live.
- **A cancel lands on the wall clock's terms.** Cancelling ends the order at
  once, including against bars the feed has not delivered yet, so an order the
  tape would already have filled can still be pulled. The trader cannot see
  those bars either, so it is symmetric ignorance rather than an edge, but the
  timestamps are not.
- **Marks stop at the last fill.** The sweep reads the bars since an account's last print, and only
  within the current session. A previous session's floors hung off an anchor that has closed.

## The Discipline

> A simulated number that looks right is not the same as one that is right.

Every rule above is reachable from a literal array of fills. None of them throws, none of them fails
a typecheck, and a wrong one is invisible until somebody's account survives a breach it should not
have. Break the source and watch the spec go red before believing it covers anything.

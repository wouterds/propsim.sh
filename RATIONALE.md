# The dancing candle

## The design in one page

The feed holds one extra bar back. The newest bar the upstream calls closed is never drawn
finished: it is cut into 12 steps of five seconds and revealed one at a time, and everything the
feed printed after it is not shown at all.

Three pure functions in `packages/engine/src/dance.ts` carry the whole thing:

| | |
| --- | --- |
| `stepsOf(bar, tick)` | the deterministic path. 12 sub-bars, seeded on the bar itself |
| `shownOf(bar, at, tick)` | the steps the tape has shown by feed time `at` |
| `settledOf(bars, at, tick)` | every step of every bar shown in full. What the matcher and the sweep read |

`at` is the feed's own clock, `meta.regularMarketTime`, exposed by the new `getTape`. The dance of a
bar runs on the elapsed time of the bar **after** it: `ran = (at - (bar.time + MINUTE)) / MINUTE`.

That anchor is the whole design. It makes one statement true:

> A bar is shown in full **exactly** when its successor closes, which is **exactly** when the feed
> publishes that successor and the bar stops being the newest one.

So "every bar but the newest" and "every bar the trader has seen all of" are the same set. The
matcher and the floor sweep both take `settledOf`, so neither can reach a step the chart has not
drawn, and both reach every step it has. That is the proof that the screen and the fill are one
thing, and it is one line of arithmetic rather than a protocol.

Everything else follows. A manual fill is stamped at the open of the step its price came from, so a
resting order placed part way through a bar can fill on a later step of that same bar. `matchesOf`
and `markingOf` are untouched apart from a timeline index that `markingOf` needed once the tape got
twelve times denser.

## The seven questions

### 1. Does the dance apply on every timeframe, or only 1m?

**Every timeframe, and it is not optional.** The dance itself is always on one minute bars, because
that is the finest thing the tape publishes. What changes per timeframe is the candle the newest
step is drawn into.

The reason this is not a preference: `getCandles(15m, forming: true)` returns a 15 minute bar that
runs up to the feed's frontier, which **includes the minutes being held back**. Drawing it would
show a high the dance has not reached, which is exactly the failure the whole change exists to
prevent. Even the newest *closed* 15m bar can contain the danced minute, so it is not enough to drop
the forming one.

So `tapeOf` keeps only the coarse bars that end at or before the danced minute, and rebuilds the
newest bucket out of the minutes, ending on the revealed prefix. On a 1m chart that reduces to the
danced bar itself, so there is one code path and no branch on timeframe.

**Rejected:** dance only the 1m chart. It leaves four of five timeframes both frozen and leaking,
which is worse than today, not better.

**Rejected:** build every timeframe out of 1m bars. Yahoo caps 1m at about eight days, and a 1h
chart wants a month.

**Cost:** one extra upstream request per symbol per cache window on a coarse chart. The `shared`
layer collapses every viewer onto it, and on a 1m chart it is literally the same cache key.

### 2. Whole system or display only?

**System wide, and it has to be, or the change is pointless.** `matching` and `marking` both read
`settledOf`, so the cron sees the same tape the chart does, one bar behind the feed.

Display only was never a real option: it is the desync the task describes, restated. The
alternative that *was* tempting is to let the cron match on the **revealed prefix** of the bar still
dancing, which is monotone and therefore safe against re-judging, and would halve the worst case
latency from a fill. I rejected it because the cron and a given browser read the shared cache at
different instants, so the cron's `at` can be a few seconds ahead of the browser's. That reopens
"fills at a level the dance has not reached yet" in a small window, and the whole point of the
design is that the window is provably zero.

News windows, floors and the session cut all move with it, which is correct rather than a side
effect. `heldThroughOf` already takes the tape's frontier as `asOf`, and that frontier is now the
last step shown rather than the last bar delivered. The 17:00 CT cut is read off a fill's timestamp,
and a fill's timestamp is now a step time inside the same real minute it always was, so the session
a trade lands in does not change. What changes is that the whole system is one minute further
behind the exchange, on top of the ten it already was.

### 3. Does the floor sweep read the danced path?

**Yes.** `marking` passes `settledOf(...)` into `markingOf`, so a liquidation lands on the five
seconds the trader watched and `liquidationMarksOf` solves inside a step rather than inside a
minute.

The alternative, whole 1m bars for the sweep, is not *wrong* in the way the question implies: with
the extra lag it would still only read minutes the trader was shown in full, and it would find the
breach in the same minute, because a minute's extreme is the extreme of its own steps. What it would
lose is the instant and the mark. It would also leave the screen and the ledger disagreeing about
the order a minute printed in, which is one truth too many for a codebase whose entire argument is
that there is only one tape.

This does change outcomes, and I want that on the record rather than buried. `markingOf` reads a
bar's low before letting its high raise the peak, because nothing said which came first. Inside a
step that is still true. Across a minute the dance now does say, so a minute that rallied before it
fell raises the floor before the fall is read against it. That is harsher than the old reading for
a position that was on the right side of the rally. It is also what the trader watched happen.

The sweep got twelve times more bars, which turned `markingOf`'s per-instant linear scan into
something quadratic enough to matter: an account holding a position since the session open would
have gone from about 2 million comparisons to 280 million. `timelineOf` indexes the tape by instant
once, which replaces both `minutesOf` and `barsAt` with less code. That is the only change to
`markingOf`'s behaviour, and a new spec pins the ordering it depends on.

### 4. Once a danced bar is old, what do fills read?

**The steps. Always the steps, for every bar, forever.** There is no path in the code that reads a
plain 1m bar for a fill or a floor.

The steps of a bar are a pure function of that bar, so re-reading a settled bar a week later gives
the identical twelve sub-bars and the identical decision. Retroactive re-judging is not prevented by
a rule here, it is impossible by construction, which is the only kind of prevention worth having.

**Rejected:** steps while dancing, whole bar afterwards. It is the retroactivity bug the question is
pointing at, and the codebase already treats that class of thing as serious enough to snapshot
`lockAboveStart` onto the account.

Note the one real change this brings: a limit that the whole bar reached now fills at the open of
the *step* that reached it rather than the open of the *minute*, so a bar that gapped through a
level gives less spurious price improvement. That is a fidelity gain, not a regression, but it does
mean fills on new bars differ from what the old code would have decided. Existing rows are
untouched.

### 5. Where in the dance are we after a reload or a restart?

**Wherever `(at - (bar.time + MINUTE)) / MINUTE` says.** Nothing is stored, so there is nothing to
lose. The path is seeded on the bar, so a fresh process draws the identical steps.

The obvious anchor, wall time within the current minute, is broken and it took a while to see why.
A bar becomes the frontier at an arbitrary offset into the wall minute, so the dance would jump to
that offset when the bar arrived and then **restart from zero** at the minute boundary while the bar
was still the newest one. The candle would walk backwards once a minute.

The other tempting anchor, "when this process first saw the bar", is per-process state. Two web
containers would dance the same bar differently, which breaks the one thing the design is for.

The feed's own clock has neither problem, and it is what AGENTS.md demands anyway: every rule is
read on the tape's clock and never on the wall clock. It reaches 1.0 exactly as the successor closes,
so the handover to the next bar is continuous with no jump and no restart.

One consequence I had to act on: `at` arrives with the cached chart response, so the reveal only
advances when the cache refreshes. At the old 15 second freshness the candle moved three steps at a
time, twice a minute, which is not a pulse. `FRESH_SECONDS` is now 5, matching the step and the SSE
tick. The `shared` layer still collapses every viewer and the cron onto one upstream request per key
per window, so the cost is upstream requests per key going from 4 a minute to 12.

### 6. Market shut, or the feed stalls?

**The candle finishes its steps and then holds still.** `ran` is clamped, so a clock that stops
leaves the reveal where it was, and a clock that runs on past the end of a bar that never got a
successor leaves the candle complete. Both are honest: the first says the tape stopped talking, the
second says the minute is over and nothing has traded since.

There is no timeout, no heartbeat and no "is the market open" branch, because there is nothing to
decide. The dance is a function of the feed's clock, and a dead feed has a dead clock.

The SSE stream already swallows a failed read and pushes nothing, which is unchanged: the last
candle pushed stays on screen. A thin market with a gap between bars behaves the same way, the
candle completes and waits, which is what a minute with no trades in it looks like.

### 7. The simulator now invents price sequence

`.agents/docs/rules.md` has a new section, `The Dancing Candle`, stating plainly that the prices are
the bar's and the order is ours, with the anchor argument and the list of what it changed. The
`Known Fidelity Limits` list and the `Liquidation` and peak ratchet sections are updated where they
claimed a bar says nothing about its own order.

**Both `/rules` and the knowledge base disclose it, and the knowledge base had to.** The article
`where-prices-come-from` said "Nothing is generated, smoothed or replayed", which stops being true
the moment this ships. Leaving a false sentence on a page whose entire job is to list where the
simulator differs from a real account would be worse than the invention itself. There is a new
article, `the-dancing-candle`, and `how-fills-are-decided` and `bars-not-ticks` are corrected to say
steps rather than bars. `/rules` gets a paragraph in the section on continuous breach checking,
where a trader is already reading about precision inside a bar.

The framing on all three is the same and is not a softening: every price shown or filled really
traded inside that minute, the order is the simulator's, and it is the same order the fills are
decided in.

## The path shape, which is the one genuinely subtle decision

The obvious path is a polyline: open, then the low, then the high, then the close for an up bar, and
the mirror for a down one. It is three lines of code and it looks like a candle forming.

It is also a guaranteed free trade. The first leg always runs against the eventual close, so five
seconds into a bar the trader knows its colour. Worse, the flaw survives every fix aimed at it:
randomise which extreme comes first and the trader still knows, once they can identify the first
leg, that price will turn and reach the other extreme, and the other extreme is on the far side of
the open, because a bar's high is never under its open and its low is never over it. A guaranteed
retrace to the open, once a minute, at the cap.

So the path is a seeded walk inside the bar's range, with the bar's own high and low stretched out
of the two steps the walk already put furthest that way. Every step is inside the real range, the
extremes both print, the first step is the open and the last close is the bar's close, so the candle
settles as exactly the bar it came from.

This does not make the dance unpredictable, and I am not going to claim it does. It makes the next
step depend on the bar's high, low and close, which are the three things the trader has not been
shown. That is a much better place for the secret to live than in a shape.

**Rejected:** uniform random points inside the range. Same guarantees, but price teleporting across
the range every five seconds does not look like a tape.

**Rejected:** driving the walk from a hash of the prices alone with no walk structure, or from
volume. Neither buys anything the seeded walk does not.

The walk also snaps to the contract's tick, which is why `stepsOf` takes one. Without it the ticket
offered MNQ at 29236.31 on a quarter point grid, which is a price that could not have traded whatever
range it sits in. Checked against a real day of MNQ, MGC and SIL: every off-grid step price came
straight off the feed's own bar, because Yahoo serves float32 and three quarters of MGC's closes are
already off the grid. The dance adds none of its own.

## Known weaknesses

- **The dance is still exploitable in principle.** Someone who reverse engineers `noiseOf` and
  `pathOf` cannot predict a step without the bar's high, low and close, but they can confirm the
  path after the fact and they will notice that price never leaves a fixed band once the extremes
  have printed. I have not modelled an adversary further than that, and the fidelity limits say so.
- **A fill lands up to about two minutes after the dance passed the level.** The cron matches once a
  minute and refuses the bar still dancing, so an order swept at step 2 of a bar is filled by the
  sweep that runs after that bar finishes. The chart shows the sweep at the right moment and the
  fill carries the right timestamp, but the blotter is late. Running `tape` more often is the fix and
  it is not part of this change.
- **The blotter can show a fill slightly before the chart shows the sweep.** The cron and a browser
  read the same shared cache at different instants, so the cron can be a few seconds ahead. The fill
  is still stamped on the step the trader will see. It is an ordering wobble on screen, not a wrong
  fill.
- **`FRESH_SECONDS` at 5 triples the upstream request rate per cache key.** It is still one request
  per key per five seconds however many people are watching, but Yahoo is an unofficial feed with no
  published limit and this is the change most likely to draw a 429. The failure mode is benign, a
  stale answer or a skipped push, but the candle would visibly stutter.
- **A coarse chart at a session gap can lose part of its newest candle.** The rebuild reads 1m bars
  over `1d`, so if the coarse grid leaves a bucket starting more than a day back the minutes are not
  all there. It needs a gap longer than a trading day inside a single 1h bucket, which is not a real
  case, but it is not defended against either.
- **`volume` on the danced candle is prorated by steps shown.** Nothing draws volume anywhere in the
  app, so this is a placeholder that happens to be honest rather than a considered number.
- **A step's price is on the grid or off it exactly as the feed's own bar is.** The walk snaps, the
  bar's extremes are passed through untouched, and Yahoo's float32 values for the metals contracts
  are already off grid. Fixing that means rounding the feed, which is a different change.
- **The peak ratchet got harsher inside a minute**, as set out under question 3. Nobody's stored
  numbers change, but a live account can now be liquidated by a rally-then-fall minute that the old
  reading would have let through. That is a deliberate consequence of having one path, and it is
  documented in `rules.md`.

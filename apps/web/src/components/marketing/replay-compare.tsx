type Tone = "up" | "down" | "neutral";

const TONE: Record<Tone, string> = {
  up: "text-up",
  down: "text-down",
  neutral: "text-ink",
};

type Run = {
  badge: string;
  headline: string;
  headlineTone: Tone;
  verdict: string;
  verdictTone: Tone;
  metrics: { label: string; value: string; tone: Tone }[];
};

const RUNS: Run[] = [
  {
    badge: "Run 1, as traded",
    headline: "-604.00",
    headlineTone: "down",
    verdict: "Daily floor breached, 14:52",
    verdictTone: "down",
    metrics: [
      { label: "Worst equity", value: "-712.00", tone: "down" },
      { label: "Room at the close", value: "-4.00", tone: "down" },
      { label: "Trades", value: "11", tone: "neutral" },
      { label: "Largest position", value: "4 contracts", tone: "neutral" },
    ],
  },
  {
    badge: "Run 2, replay",
    headline: "+268.00",
    headlineTone: "up",
    verdict: "Within rules at the bell",
    verdictTone: "up",
    metrics: [
      { label: "Worst equity", value: "-191.00", tone: "down" },
      { label: "Room at the close", value: "+341.00", tone: "up" },
      { label: "Trades", value: "4", tone: "neutral" },
      { label: "Largest position", value: "2 contracts", tone: "neutral" },
    ],
  },
];

const ReplayCompare = () => (
  <section id="replay" className="border-line/70 border-b">
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <p className="text-[11px] text-accent uppercase tracking-wider">Replay</p>
      <h2 className="mt-3 max-w-2xl font-semibold text-2xl text-ink tracking-tight sm:text-3xl">
        The same Tuesday, twice.
      </h2>
      <p className="mt-4 max-w-xl text-muted text-sm leading-relaxed">
        Four dollars past a six hundred dollar floor is still a breach, and on the day it happens
        there is no way to ask what the other version of the afternoon was worth. This is that
        question, answered against the bars that actually printed.
      </p>

      <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
        {RUNS.map((run) => (
          <article key={run.badge} className="bg-raised p-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-faint uppercase tracking-wider">{run.badge}</span>
              <span className="text-faint text-xs tabular">MNQ, 05 Aug</span>
            </div>

            <p className={`mt-4 font-semibold text-3xl tabular ${TONE[run.headlineTone]}`}>
              {run.headline}
            </p>

            <dl className="mt-6 space-y-2 border-line/70 border-t pt-4">
              {run.metrics.map((metric) => (
                <div key={metric.label} className="flex items-baseline justify-between text-sm">
                  <dt className="text-muted">{metric.label}</dt>
                  <dd className={`tabular ${TONE[metric.tone]}`}>{metric.value}</dd>
                </div>
              ))}
            </dl>

            <p
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider ${TONE[run.verdictTone]} ${run.verdictTone === "up" ? "bg-up/10" : "bg-down/10"}`}
            >
              <span
                className={`size-1.5 rounded-full ${run.verdictTone === "up" ? "bg-up" : "bg-down"}`}
              />
              {run.verdict}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-6 text-center text-faint text-xs">
        Same 386 bars, same engine, same account rules. The only variable left is the person.
      </p>
    </div>
  </section>
);

export default ReplayCompare;

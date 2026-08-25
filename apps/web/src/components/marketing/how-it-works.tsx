const STEPS = [
  {
    title: "Load a session",
    body: "Pick a day of MNQ and the bars it actually printed, 1m through 1h. The window stays inside one contract's life, so a quarterly roll never shows up as a move that never happened.",
  },
  {
    title: "Trade it",
    body: "Market, limit and stop orders, with a bracket attached if you want one. Every fill drops straight into the rule engine, which has no idea whether the bar behind it is from today or from March.",
  },
  {
    title: "Replay it",
    body: "Same bars, second run. The engine is a pure function over the fill stream, so between the two runs the only thing that changed is you.",
  },
];

const HowItWorks = () => (
  <section id="how" className="border-line/70 border-b">
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <p className="text-[11px] text-accent uppercase tracking-wider">How it works</p>
      <h2 className="mt-3 max-w-2xl font-semibold text-2xl text-ink tracking-tight sm:text-3xl">
        Three steps, and the third one is the whole point.
      </h2>

      <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="bg-raised p-6">
            <span className="font-medium text-2xl text-faint tabular">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 font-medium text-ink">{step.title}</h3>
            <p className="mt-2 text-muted text-sm leading-relaxed">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default HowItWorks;

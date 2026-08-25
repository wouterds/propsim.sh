const FEATURES = [
  {
    title: "Floors that ratchet",
    body: "The trailing floor only ever rises. A drawdown never hands back room the account has already given up for good.",
  },
  {
    title: "Breached is breached",
    body: "The floor is checked per tick, not per fill. A position that went through it at 14:52 does not survive by closing green at 15:40.",
  },
  {
    title: "Open trades count",
    body: "Unrealised profit and loss is equity. A position that is open and down reaches the floor exactly as a closed one does, and one that is up raises the peak the moment it gets there.",
  },
  {
    title: "Two floors, not one",
    body: "The soft floor resets at the next session and is measured from the day's open. The hard floor never resets and is measured from peak equity. Confusing them is how accounts die by surprise.",
  },
  {
    title: "Deterministic by construction",
    body: "The engine never reaches for a clock or a socket. The same code judges a delayed live tick and a stored bar, which is what makes the rules testable rather than merely written down.",
  },
  {
    title: "Bars that really printed",
    body: "Intraday MNQ candles, the same series the chart draws. Nothing is generated, nothing is smoothed, and no order ever leaves the browser.",
  },
];

const FeatureGrid = () => (
  <section id="engine" className="border-line/70 border-b">
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] text-accent uppercase tracking-wider">The engine</p>
          <h2 className="mt-3 max-w-xl font-semibold text-2xl text-ink tracking-tight sm:text-3xl">
            The chart is the easy half. The rules are the product.
          </h2>
        </div>
        <p className="max-w-sm text-muted text-sm leading-relaxed">
          Every number below is arithmetic that never throws when it is wrong. That is exactly why
          it is the part worth getting right.
        </p>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="bg-raised p-6">
            <h3 className="flex items-center gap-2 font-medium text-ink">
              <span className="size-1.5 rounded-full bg-accent" />
              {feature.title}
            </h3>
            <p className="mt-2 text-muted text-sm leading-relaxed">{feature.body}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureGrid;

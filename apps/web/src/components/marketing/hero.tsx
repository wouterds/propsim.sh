import { href, Link } from "react-router";
import GridBackdrop from "~/components/layout/grid-backdrop";
import AccountPreview from "~/components/marketing/account-preview";

const FACTS = ["MNQ, micro Nasdaq 100", "Live bars on a delay", "No card, no broker"];

const Hero = () => (
  <section className="relative overflow-hidden border-line/70 border-b">
    <GridBackdrop />

    <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-raised/70 px-3 py-1 text-[11px] text-muted uppercase tracking-wider">
          <span className="size-1.5 rounded-full bg-accent" />
          Live tape, on a delay
        </p>

        <h1 className="mt-6 font-semibold text-4xl text-ink leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          Blow up a prop account
          <br />
          that costs{" "}
          <span className="text-accent underline decoration-4 decoration-accent/30 underline-offset-[0.15em]">
            nothing
          </span>
          .
        </h1>

        <p className="mt-6 max-w-xl text-[1rem] text-muted leading-relaxed">
          propsim runs a live MNQ session on a short delay and puts every fill through a prop firm's
          rule engine. The daily loss limit, the trailing drawdown that ratchets on your peak
          equity, the breach that quietly ends an account. The same rules an evaluation charges you
          to learn, on an account that costs nothing to lose.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to={href("/trading")}
            className="inline-flex h-10 items-center rounded bg-accent px-5 font-medium text-sunken transition-colors hover:bg-accent/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          >
            Open the simulator
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-faint text-xs">
          {FACTS.map((fact) => (
            <li key={fact} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-line-strong" />
              {fact}
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:pl-6">
        <AccountPreview />
      </div>
    </div>
  </section>
);

export default Hero;

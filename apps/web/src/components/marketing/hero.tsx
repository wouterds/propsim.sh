import { href, Link } from "react-router";
import GridBackdrop from "~/components/layout/grid-backdrop";
import AccountPreview from "~/components/marketing/account-preview";

const FACTS = ["MNQ, micro Nasdaq 100", "1m to 1h bars", "No card, no broker"];

const Hero = () => (
  <section className="relative overflow-hidden border-line/70 border-b">
    <GridBackdrop />

    <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-raised/70 px-3 py-1 text-[11px] text-muted uppercase tracking-wider">
          <span className="size-1.5 rounded-full bg-accent" />
          The session already happened
        </p>

        <h1 className="mt-6 font-semibold text-4xl text-ink leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          Trade the same
          <br />
          session{" "}
          <span className="text-accent underline decoration-4 decoration-accent/30 underline-offset-[0.15em]">
            twice
          </span>
          .
        </h1>

        <p className="mt-6 max-w-xl text-[1rem] text-muted leading-relaxed">
          propsim replays a real futures session bar by bar and runs every fill through a prop
          firm's rule engine. The daily loss floor, the trailing drawdown, the breach that quietly
          ends an account. Then it hands you the same bars again, so you find out what the other
          decision was worth.
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

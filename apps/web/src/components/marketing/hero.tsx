import { href, Link } from "react-router";
import GridBackdrop from "~/components/layout/grid-backdrop";
import AccountPreview from "~/components/marketing/account-preview";

const Hero = () => (
  <section className="relative overflow-hidden border-line/70 border-b">
    <GridBackdrop />

    <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
      <div>
        <h1 className="font-semibold text-4xl text-ink leading-[1.1] tracking-tight sm:text-5xl">
          A free prop trading simulator.
        </h1>

        <p className="mt-6 max-w-xl text-[1rem] text-muted leading-relaxed">
          propsim.sh gives you a simulated futures account with a prop firm's rules on it. You trade
          live CME prices on a short delay, and every fill runs against the two loss limits that end
          funded accounts. There is nothing to pay, and none of it is real money.
        </p>

        <Link
          to={href("/terminal")}
          className="mt-8 inline-flex h-10 items-center rounded bg-accent px-5 font-medium text-sunken transition-colors hover:bg-accent/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          Start trading
        </Link>
      </div>

      <div className="lg:pl-6">
        <AccountPreview />
      </div>
    </div>
  </section>
);

export default Hero;

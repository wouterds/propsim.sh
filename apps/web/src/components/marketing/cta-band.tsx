import { href, Link } from "react-router";

const CtaBand = () => (
  <section className="border-line/70 border-b">
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="relative overflow-hidden rounded-xl border border-line bg-raised px-6 py-12 text-center sm:px-12">
        <div
          aria-hidden="true"
          className="-translate-x-1/2 pointer-events-none absolute top-[-8rem] left-1/2 h-[16rem] w-[28rem] rounded-full bg-accent/10 blur-[100px]"
        />
        <div className="relative">
          <h2 className="font-semibold text-2xl text-ink tracking-tight sm:text-3xl">
            The day you blew is still on the tape.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted text-sm leading-relaxed">
            Load it, trade it again, and let the rule engine settle the argument. It takes an email
            address that nobody checks.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={href("/login")}
              className="inline-flex h-10 items-center rounded bg-accent px-5 font-medium text-sunken transition-colors hover:bg-accent/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            >
              Open the simulator
            </Link>
            <Link
              to={href("/dashboard")}
              className="inline-flex h-10 items-center rounded border border-line px-5 text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            >
              See an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CtaBand;

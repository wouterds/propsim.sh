import { href, Link } from "react-router";

const RULES = [
  {
    title: "Two limits, and they work differently",
    body: "The daily limit is measured from the balance you opened the day with, and it resets tomorrow. The trailing limit is measured from the highest equity the account has ever reached, and it never resets.",
  },
  {
    title: "The trailing limit only moves up",
    body: "Go up 400 and give it back, and the floor keeps the 400. You do not get that room again.",
  },
  {
    title: "Open trades count",
    body: "Your equity includes what is still floating. A position that is open and losing can breach the account before you close it.",
  },
  {
    title: "A breach is a breach",
    body: "The limits are checked continuously, not when you close. A trade that went through the floor at 14:52 does not survive by finishing green.",
  },
];

const Rules = () => (
  <section className="border-line/70 border-b">
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <h2 className="max-w-xl font-semibold text-2xl text-ink tracking-tight">
        The rules it enforces
      </h2>

      <dl className="mt-10 grid gap-8 sm:grid-cols-2">
        {RULES.map((rule) => (
          <div key={rule.title}>
            <dt className="font-medium text-ink">{rule.title}</dt>
            <dd className="mt-2 text-muted text-sm leading-relaxed">{rule.body}</dd>
          </div>
        ))}
      </dl>

      <Link
        to={href("/rules")}
        className="mt-10 inline-flex rounded-sm text-muted text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
      >
        Read the whole rulebook
      </Link>
    </div>
  </section>
);

export default Rules;

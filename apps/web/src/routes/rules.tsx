import { href, Link } from "react-router";
import { formatMoney } from "~/lib/format";
import { CONSISTENCY_CAP, PLANS, planOr, trailStopsAt } from "~/lib/plans";
import type { Route } from "./+types/rules";

export const meta: Route.MetaFunction = () => [
  { title: "The rules, propsim.sh" },
  {
    name: "description",
    content:
      "How the daily loss limit and the trailing drawdown are measured, when they are checked, and what a breach costs you.",
  },
];

const PLAN = planOr("daily-50k");

const SECTIONS = [
  {
    id: "two-floors",
    title: "There are two floors, and they behave differently",
    body: [
      `The daily loss limit is measured from the balance you opened the session with, and it resets with the next session. On a ${PLAN.label} it is ${formatMoney(PLAN.dailyLossLimit)}. Hitting it ends the day. The account survives.`,
      `The trailing drawdown is measured from the highest equity the account has ever reached, and it never resets. On a ${PLAN.label} it is ${formatMoney(PLAN.trailingDrawdown)}. Hitting it ends the account.`,
      "Most accounts are lost to the second one by people watching the first.",
    ],
  },
  {
    id: "ratchet",
    title: "The trailing floor only moves up",
    body: [
      "Every new equity high drags the floor up behind it. Nothing drags it back down. Go up four hundred and give it all back, and the floor keeps the four hundred: you are now four hundred closer to being cut than you were before the winning trade.",
      `It stops climbing once it reaches a hundred above your starting balance. On a ${PLAN.label} that happens at ${formatMoney(trailStopsAt(PLAN))} of equity, and from that point the floor is fixed at ${formatMoney(PLAN.size + 100)} forever. Getting there is the whole game.`,
    ],
  },
  {
    id: "open-trades",
    title: "Open trades count against you",
    body: [
      "Both floors are measured against equity, not against your closed balance. Equity includes whatever is still floating on an open position.",
      "A position that is open and losing can breach the account before you close it. Nothing has to be realised for the account to be gone.",
    ],
  },
  {
    id: "continuous",
    title: "A breach is checked continuously, not at the close",
    body: [
      "The floors are tested on every tick. A trade that went through the floor at 14:52 does not survive by finishing green at 15:10.",
      "This is the single biggest difference between a prop account and a brokerage account, and it is why a strategy with a good end-of-day record can still fail here.",
    ],
  },
  {
    id: "consistency",
    title: "One session cannot carry the account",
    body: [
      `No single day may be more than ${Math.round(CONSISTENCY_CAP * 100)}% of everything you won. Make the whole target in one session and you have not passed, you have gambled once and got away with it.`,
      "The rule exists because a firm is buying repeatable behaviour, not a lucky afternoon.",
    ],
  },
  {
    id: "size",
    title: "Position limits are counted across everything open",
    body: [
      `Each plan caps what you can hold at once: ${PLANS.map((plan) => `${plan.label} at ${plan.maxMinis} minis`).join(", ")}. Ten micros count as one mini, so the two numbers are one limit said twice.`,
      "The cap is on what is open at the same moment, not on what you traded over the day.",
    ],
  },
];

const Rules = () => (
  <>
    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h1 className="font-semibold text-4xl text-ink leading-[1.1] tracking-tight">
          The rules it enforces
        </h1>
        <p className="mt-6 max-w-2xl text-muted leading-relaxed">
          These are the rules that end funded accounts. They are worth reading once, slowly, because
          none of them announces itself while you are in a trade.
        </p>

        <nav aria-label="On this page" className="mt-10 max-w-3xl border-line/70 border-t pt-6">
          <ul className="grid gap-2 sm:grid-cols-2">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="rounded-sm text-muted text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>

    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl space-y-14">
          {SECTIONS.map((section) => (
            <article key={section.id} id={section.id} className="scroll-mt-20">
              <h2 className="font-semibold text-ink text-xl tracking-tight">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-muted leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </div>

        <div className="mt-16 max-w-3xl rounded-lg border border-line bg-raised px-5 py-5">
          <p className="text-ink">Meet them for nothing first.</p>
          <p className="mt-2 text-muted text-sm leading-relaxed">
            Every plan here is free, and you can open as many as you want.
          </p>
          <Link
            to={href("/plans")}
            className="mt-4 inline-flex h-9 items-center rounded bg-accent px-4 font-medium text-sm text-sunken transition-colors hover:bg-accent/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          >
            See the plans
          </Link>
        </div>
      </div>
    </section>
  </>
);

export default Rules;

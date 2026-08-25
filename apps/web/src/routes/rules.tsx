import { href, Link } from "react-router";
import { AFTER_MINUTES, BEFORE_MINUTES } from "~/lib/blackout";
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

type Section = {
  id: string;
  title: string;
  body: string[];
};

type Group = {
  id: string;
  heading: string;
  intro: string;
  sections: Section[];
};

const GROUPS: Group[] = [
  {
    id: "limits",
    heading: "The limits",
    intro: "Two floors sit under the account. One ends the day, the other ends the account.",
    sections: [
      {
        id: "two-floors",
        title: "There are two floors, and they behave differently",
        body: [
          `The daily loss limit is measured from the balance you opened the session with, and it resets with the next session. On a ${PLAN.label} it is ${formatMoney(PLAN.dailyLossLimit)}. Hitting it stops you trading until the next session. The account survives.`,
          `The trailing drawdown is measured from the highest equity the account has ever reached, and it never resets. On a ${PLAN.label} it is ${formatMoney(PLAN.trailingDrawdown)}. Hitting it ends the account.`,
          "The daily limit is fixed. It does not climb with the trailing floor, so once the trailing floor has risen past it the trailing floor is the one that will get you first.",
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
          `Your largest winning day, divided by the profit on the account, has to come out at ${Math.round(CONSISTENCY_CAP * 100)}% or less. Make the whole target in one session and you have not passed, you have gambled once and got away with it.`,
          "The denominator is what you have actually made, not what you made on your good days, so a losing day pushes the number the wrong way twice.",
          "This one applies while you are proving yourself. Once the account is funded the requirement is gone.",
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
    ],
  },
  {
    id: "conduct",
    heading: "What you may and may not do",
    intro:
      "Most of what traders assume is banned is allowed. The bans are narrow, and they are aimed at gaming a simulator rather than at trading.",
    sections: [
      {
        id: "news",
        title: "Be flat for red folder news",
        body: [
          `You have to be flat from ${BEFORE_MINUTES} minute before a high impact US release through ${AFTER_MINUTES} minute after it. You may not hold a position through that window and you may not open one in it. High impact is the red folder on an economic calendar: payrolls, CPI, the FOMC rate decision.`,
          "On a daily payout account this is a hard breach. It ends the account rather than the day, and it does so whether the trade won or lost. On the slower plans the same firms sell, trading the news is allowed outright. Paying out every day is what buys the stricter rule.",
          "The terminal shades the window on the chart and says so in a banner while it is open, so there is no calendar to keep in another tab.",
        ],
      },
      {
        id: "allowed",
        title: "Bots, scalping and averaging in are allowed",
        body: [
          "Automated systems and trade copiers are permitted. So is genuine scalping, and so is scaling into a position or averaging down. None of these needs permission and none of them is a breach.",
          "You carry the consequences of your own software. A bot that malfunctions and breaches the account has breached the account.",
          "Adding to a loser repeatedly is allowed and is still how most accounts die.",
        ],
      },
      {
        id: "hedging",
        title: "Hedging across accounts is not trading",
        body: [
          "Taking opposing positions on the same instrument in two accounts is prohibited. Long in one and short in the other guarantees one of them profits whichever way the market goes, which is not a strategy, it is a way of manufacturing a payout.",
          "It counts across accounts, across instruments that track each other, between minis and micros of the same product, and across firms. Inside one account you may hold both sides, because there is nothing to manufacture.",
          "Detection is automated and the first finding is not the end: the accounts are rolled back to the previous day's balance. A repeat breaches all of them.",
        ],
      },
      {
        id: "microscalping",
        title: "Microscalping is about fills, not about speed",
        body: [
          "Very large size held for a few seconds to skim tiny moves is prohibited, because it works against how a simulator fills orders rather than against the market.",
          "The published trigger is more than half your profit coming from trades held five seconds or less. That flags the account for a human to look at rather than ending it: a first finding is a warning, and only a repeat forfeits the profit.",
          "Ordinary scalping is fine. The line is whether the trade would have behaved the same way with real money in front of it.",
        ],
      },
      {
        id: "hft",
        title: "High frequency trading is prohibited",
        body: [
          "Algorithms firing hundreds of orders in minutes are banned. The stated reason is load on the platform rather than any view about the strategy.",
        ],
      },
      {
        id: "hours",
        title: "The session closes, and closing it is not a breach",
        body: [
          "Positions are flat by 16:45 New York time, Monday to Friday, and anything still open is closed for you. Being closed out this way does not fail the account. Trading reopens at 18:00 New York time, Sunday to Thursday, and on a holiday with an early close the early close is the deadline.",
          "The firms publish these times for their slower plans and say nothing about them for the daily ones. This is the simulator's reading, not a rule quoted from anybody.",
        ],
      },
      {
        id: "dormant",
        title: "An account you never trade is removed",
        body: [
          "An account that has not produced at least a dollar of profit or loss in thirty days is treated as abandoned and deleted. A breached one is deleted on the same clock unless it is reset first.",
        ],
      },
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

        <nav
          aria-label="On this page"
          className="mt-10 grid max-w-3xl gap-6 border-line/70 border-t pt-6 sm:grid-cols-2"
        >
          {GROUPS.map((group) => (
            <div key={group.id}>
              <p className="text-[11px] text-faint uppercase tracking-wider">{group.heading}</p>
              <ul className="mt-2 space-y-1.5">
                {group.sections.map((section) => (
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
            </div>
          ))}
        </nav>
      </div>
    </section>

    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl space-y-16">
          {GROUPS.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-20">
              <h2 className="font-semibold text-2xl text-ink tracking-tight">{group.heading}</h2>
              <p className="mt-3 text-muted leading-relaxed">{group.intro}</p>

              <div className="mt-10 space-y-14">
                {group.sections.map((section) => (
                  <article key={section.id} id={section.id} className="scroll-mt-20">
                    <h3 className="font-semibold text-ink text-lg tracking-tight">
                      {section.title}
                    </h3>
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="mt-4 text-muted leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </article>
                ))}
              </div>
            </section>
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

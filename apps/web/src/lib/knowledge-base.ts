export type Article = {
  slug: string;
  /** The question a reader arrives with, in their words rather than ours. */
  title: string;
  /** The answer in one or two sentences. It is the card on the index and the whole answer for most readers. */
  summary: string;
  body: string[];
  /** Slugs of articles that answer the question this one raises next. */
  related?: string[];
};

export type Category = {
  slug: string;
  title: string;
  description: string;
  articles: Article[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    description: "What this is, what it costs, and what it cannot do for you.",
    articles: [
      {
        slug: "what-is-propsim",
        title: "What is propsim.sh?",
        summary:
          "A simulated futures account with a prop firm's rules on it, traded against live CME prices on a short delay.",
        body: [
          "You get a starting balance, a profit target, a daily loss limit and a trailing drawdown. You trade real CME futures prices against them, and the rules are enforced the way a funded account enforces them.",
          "The point is narrow. Prop firms charge for an evaluation and charge again for a reset, and most people who fail one fail on a rule rather than on a bad read. This lets you find out which rule ends you, before you pay anyone to find out for you.",
          "It is not a replay tool and not a backtester. The tape is live.",
        ],
        related: ["is-it-free", "is-real-money-involved", "is-this-a-replay"],
      },
      {
        slug: "is-it-free",
        title: "Is it free?",
        summary: "Yes. No fee, no card, no upsell, and no limit on how many accounts you open.",
        body: [
          "There is nothing to pay and nothing to enter a card for. Firms charge for the evaluation and again for a reset, which is the part that makes failing expensive.",
          "Here you open as many accounts as you want, on any plan, and start again whenever you want.",
        ],
        related: ["how-many-accounts", "starting-again"],
      },
      {
        slug: "is-real-money-involved",
        title: "Is any real money involved?",
        summary:
          "No. Nothing is ordered, nothing reaches an exchange, and there is nothing to withdraw.",
        body: [
          "Every balance on the site is simulated. No order is routed, no position exists anywhere but here, and no money moves in either direction.",
          "The prices are real. The trading is not.",
        ],
        related: ["do-you-pay-out", "what-is-propsim"],
      },
      {
        slug: "do-you-pay-out",
        title: "Do you pay out?",
        summary:
          "No. Passing an account here proves you met the rules. It does not fund you and it is not an application to any firm.",
        body: [
          "There is no payout, no funded stage and no route to one. We are not a prop firm, we are not affiliated with one, and passing here carries no weight with any of them.",
          "What you get is the answer to one question: can you hold to these rules for the length of an evaluation. That answer is worth having before you buy one.",
        ],
        related: ["is-real-money-involved", "how-many-days"],
      },
      {
        slug: "do-i-need-a-broker",
        title: "Do I need a broker or a platform?",
        summary:
          "No. The terminal runs in the browser, with nothing to install and no account to connect.",
        body: [
          "There is no broker, no data subscription and no desktop platform. You sign up and the terminal is there.",
          "Nothing you connect elsewhere is read, and nothing here reaches out to a broker on your behalf.",
        ],
        related: ["what-you-can-trade", "how-fills-are-decided"],
      },
    ],
  },
  {
    slug: "prices-and-fills",
    title: "Prices and fills",
    description: "Where the tape comes from, why it runs behind, and how a fill is decided.",
    articles: [
      {
        slug: "where-prices-come-from",
        title: "Where do the prices come from?",
        summary: "Live CME futures, on a short delay. The bars you trade are the real ones.",
        body: [
          "The tape is genuine CME futures data, a few minutes behind the exchange. The bars you see are the bars that printed, at the prices they printed.",
          "Nothing is smoothed and nothing is replayed from a stored session. The one thing that is ours is the order prices are shown in inside the newest candle, which is explained under the dancing candle.",
        ],
        related: ["why-the-tape-is-delayed", "the-dancing-candle", "is-this-a-replay"],
      },
      {
        slug: "why-the-tape-is-delayed",
        title: "Why is the tape delayed?",
        summary:
          "Real time exchange data is licensed and expensive. A delay costs nothing and changes none of what the rules test.",
        body: [
          "The feed runs roughly ten to twelve minutes behind the exchange. Real time CME data carries a licence fee per user, and this site is free.",
          "The delay changes nothing about what the rules test. A loss limit does not care when the bar printed, only how far the price moved against you while you held it.",
          "Every rule here is read on the tape's clock and never on your wall clock, because the tape is the only thing you can see. A news window, a resting order and a session boundary are all judged at the same delayed instant, so nothing is measured against a bar you were never shown.",
        ],
        related: ["where-prices-come-from", "red-folder-news", "bars-not-ticks"],
      },
      {
        slug: "what-you-can-trade",
        title: "What can I trade?",
        summary:
          "Nine CME micros: the four equity index contracts, gold, silver, copper, crude and natural gas.",
        body: [
          "Micro E-mini S&P, Nasdaq, Russell and Dow, plus micro gold, silver, copper, crude oil and natural gas. Pick one from the contract menu above the chart.",
          "Micros only for now. The full size and mini contracts are not offered, so the mini position cap on each plan is not reachable yet.",
          "Position limits are counted in micros. The mini limits published on each plan are not reachable yet, because there are no minis to trade.",
        ],
        related: ["position-limits", "commission"],
      },
      {
        slug: "how-fills-are-decided",
        title: "How are fills decided?",
        summary:
          "Against the delayed tape, at the price on screen. There is no queue and no slippage yet, so fills here are kinder than a broker's.",
        body: [
          "A market order fills at the price the tape is showing you. A resting order fills as soon as a bar reaches its price, with nothing in front of it in the queue.",
          "That is the one place this simulator is still kinder than a real broker. A real limit order sits behind everyone who got there first, and a real stop can fill well past its trigger in a fast market. Neither is modelled.",
          "A manual fill is stamped at the open of the five second step its price came from, not at the moment you clicked. Stamping it at your wall clock would put a ten minute old price under a fresh timestamp, and every rule read against that timestamp would be wrong.",
        ],
        related: [
          "slippage-and-the-queue",
          "the-dancing-candle",
          "why-the-tape-is-delayed",
          "commission",
        ],
      },
      {
        slug: "the-dancing-candle",
        title: "Why does the newest candle keep moving?",
        summary:
          "It is a minute that has already printed, being revealed five seconds at a time. Every price in it really traded, and your fills are decided on the same reveal.",
        body: [
          "The feed publishes one bar a minute. Rather than freeze the chart between two of them, the newest candle you see is a minute the tape has already delivered in full, revealed a step at a time over the following minute. Everything printed after it is held back until its turn.",
          "Every price the candle shows is a price that traded inside that minute, and the candle finishes as exactly the bar it came from. What is ours is the order the prices come out in, because a bar records its open, high, low and close and not the path between them.",
          "That order is what your fills are decided on. If the candle sweeps through your resting order, it fills, at the price you watched it reach. Nothing fills at a level the candle has not been to, and nothing is left resting after it has been through.",
          "It costs you one extra minute of delay on top of the feed's own, which is the price of the screen and the fill being the same thing.",
          "When the market is shut or the feed stops answering, the candle finishes its steps and then holds still. A chart that kept dancing on a dead market would be the lie, not the frozen one.",
        ],
        related: ["how-fills-are-decided", "where-prices-come-from", "bars-not-ticks"],
      },
      {
        slug: "is-this-a-replay",
        title: "Is this a replay of an old session?",
        summary: "No. The tape is live and runs on a short delay.",
        body: [
          "Nothing here is a recording. A stored session exists only as a test fixture for the rule engine, never as something you trade against.",
          "You cannot rewind, scrub or restart the tape, for the same reason a real evaluation does not let you. Knowing what happens next is the one thing that would make the whole exercise worthless.",
        ],
        related: ["where-prices-come-from", "what-is-propsim"],
      },
    ],
  },
  {
    slug: "accounts",
    title: "Accounts",
    description: "Opening them, breaching them, and starting again.",
    articles: [
      {
        slug: "how-many-accounts",
        title: "How many accounts can I open?",
        summary:
          "As many as you like, on any plan, at the same time. Nothing is charged and nothing is throttled.",
        body: [
          "There is no cap and no cooldown. Run a 25K and a 150K side by side if you want to see how the same trading behaves against different room.",
          "One rule does span accounts at a real firm: hedging the same instrument across two of them is banned, because it manufactures a payout rather than proving anything. That one is not enforced here, because it needs more than one account in view at once.",
        ],
        related: ["starting-again", "what-is-not-enforced"],
      },
      {
        slug: "what-happens-when-you-breach",
        title: "What happens when I breach?",
        summary:
          "The daily loss limit ends the day and the account reopens next session. The trailing drawdown ends the account for good.",
        body: [
          "These are two different outcomes and they are worth keeping apart.",
          "Breaching the daily loss limit shuts the session. Your position is left alone, closing is still allowed, and nothing that would grow the position is accepted until the next session opens. The account itself is untouched, and it can be thousands above its trailing floor while it sits locked out.",
          "Breaching the trailing drawdown ends the account. Whatever is open is flattened at the price that met the floor, every working order is cancelled, and the account moves to your closed list.",
          "Being flat through a red folder release is a third outcome, and it ends the account the same way the trailing drawdown does.",
        ],
        related: [
          "daily-loss-limit-vs-trailing-drawdown",
          "why-the-trailing-drawdown-is-the-hard-one",
          "red-folder-news",
          "starting-again",
        ],
      },
      {
        slug: "starting-again",
        title: "Can I start again?",
        summary:
          "Open a new account. A breached one stays in your list so the journal that led to it is still readable.",
        body: [
          "There is no reset fee because there is no fee. Open another account on the same plan and carry on.",
          "The breached one is not deleted straight away. Its journal, its fills and the moment it ended stay there to read, which is the part worth having.",
          "Nothing is removed for being quiet. What runs on a clock is the sign in: after 90 days without one a notice goes out, after 120 a final one, and at 150 the account is emptied and the address anonymised.",
          "The trading accounts and everything they printed are never deleted. They stop belonging to a name, which is why a trader who left still holds the place on the board that their sessions earned.",
        ],
        related: ["how-many-accounts", "what-happens-when-you-breach"],
      },
      {
        slug: "how-many-days",
        title: "Is there a minimum number of days?",
        summary:
          "No day count is published, but the consistency rule stops a one session pass in practice.",
        body: [
          "These accounts do not publish a minimum trading day count the way the older evaluation products do.",
          "The consistency rule does the same job from the other end. Your largest winning day has to be half or less of the profit on the account, so making the whole target in one session leaves you short of passing no matter how good the session was.",
        ],
        related: ["consistency", "do-you-pay-out"],
      },
      {
        slug: "position-limits",
        title: "How many contracts can I hold?",
        summary:
          "Each plan publishes a micro and a mini cap. Only the micro cap is reachable today, and it is enforced.",
        body: [
          "The cap is on net contracts held, and it scales with the plan: twenty micros on a 25K, forty on a 50K, sixty on a 100K and a hundred on a 150K.",
          "A ticket that would take you over the cap is refused rather than partly filled.",
          "The mini caps published beside them are not enforced, because the catalog is micros only for now. When minis arrive, so does that check.",
        ],
        related: ["what-you-can-trade", "commission", "what-is-not-enforced"],
      },
    ],
  },
  {
    slug: "the-rules",
    title: "The rules that end an account",
    description:
      "The floors, the news window and the costs. None of these announces itself while you are in a trade.",
    articles: [
      {
        slug: "daily-loss-limit-vs-trailing-drawdown",
        title: "What is the difference between the two loss limits?",
        summary:
          "The daily loss limit is measured from where the session opened and ends the day. The trailing drawdown is measured from your highest ever equity and ends the account.",
        body: [
          "They are independent, and confusing them is the most expensive mistake on this page.",
          "The daily loss limit is fixed for the session. It sits a set amount under the equity the session opened on, it resets at the next session, and hitting it locks you out until then. It never ends an account at any firm that sells these.",
          "The trailing drawdown is measured from the highest equity the account has ever reached. It only ever rises, it never resets, and hitting it ends the account permanently.",
          "You can be shut for the day while sitting thousands above your trailing floor, and you can lose the account on the trailing floor without ever having had a day bad enough to be locked out.",
        ],
        related: [
          "why-the-trailing-drawdown-is-the-hard-one",
          "what-happens-when-you-breach",
          "open-positions-count",
        ],
      },
      {
        slug: "why-the-trailing-drawdown-is-the-hard-one",
        title: "Why is the trailing drawdown the hard one?",
        summary:
          "It follows your peak equity up and never comes back down, so giving back a gain moves you toward a floor that kept it.",
        body: [
          "It is measured from the highest equity the account has ever reached. Go up four hundred and give it back, and the floor keeps the four hundred. You are now four hundred closer to losing the account than you were before the winning trade.",
          "This is why traders lose these accounts while showing a flat balance. Nothing about your closed profit and loss tells you where the floor is.",
          "It stops climbing once it reaches a hundred above your starting balance. From that point it never moves again, and the account can no longer be lost to a drawdown from a new high. Reaching that point is the whole game.",
        ],
        related: [
          "open-positions-count",
          "daily-loss-limit-vs-trailing-drawdown",
          "what-happens-when-you-breach",
        ],
      },
      {
        slug: "open-positions-count",
        title: "Does an open position count against the limits?",
        summary:
          "Yes, in both directions. An open loser can breach you before you close it, and an open winner permanently raises your floor.",
        body: [
          "Both floors are measured against equity, and equity includes whatever is floating on an open position. Nothing has to be realised for the account to be gone.",
          "The half that surprises people is the other one. Your peak equity counts open profit too, so a rally you never banked raises the trailing floor and keeps it there. Run a position twenty points into profit, give it all back, and you have moved the floor up under yourself without a single closed trade to show for it.",
          "The floors are read at the deepest your equity went, not where it settled. A trade that went through the floor at 14:52 does not survive by finishing green at 15:10.",
          "This is the single biggest difference between a prop account and a brokerage account, and it is why a strategy with a good end of day record can still fail here.",
        ],
        related: [
          "why-the-trailing-drawdown-is-the-hard-one",
          "bars-not-ticks",
          "daily-loss-limit-vs-trailing-drawdown",
        ],
      },
      {
        slug: "red-folder-news",
        title: "What is red folder news?",
        summary:
          "A high impact US release. You have to be flat through the window around it, and on these accounts holding a position through one is a hard breach.",
        body: [
          "Red folder means the high impact entries on the economic calendar: payrolls, CPI, the FOMC rate decision and their equivalents.",
          "You have to be flat from a minute before the release until a minute after it. Opening a position inside the window counts the same as holding one through it, because the rule is to be flat rather than to finish the window in profit.",
          "On a daily payout account this ends the account rather than the day, and it counts even if the trade was profitable. Nothing is flattened for you when it happens: the position is the breach, and closing it would rewrite what you were holding when the release printed.",
          "Nothing stops you trading into the window either. Being stopped would hide the rule, and the rule is the point. The terminal warns you in a banner while a window is open and for fifteen minutes after it, and the calendar is on the red folder events page.",
          "The window is judged on the tape's clock, not your wall clock. Because the feed runs behind, the release reaches your chart later than it reaches the exchange, and the rule follows what you were shown.",
        ],
        related: ["why-the-tape-is-delayed", "what-happens-when-you-breach", "news-calendar-reach"],
      },
      {
        slug: "commission",
        title: "Is commission charged?",
        summary:
          "Yes, per side, so a round turn pays twice. It leaves the balance, so both floors and the profit target count it.",
        body: [
          "Every fill is charged at the rate the firms publish. A micro is fifty cents a side, micro gold eighty, and micro silver a dollar sixty.",
          "It comes out of the balance, so it reaches your equity, so it reaches both floors and the target. A round turn at the full micro cap on a 50K spends forty dollars of a twelve hundred dollar daily limit before the trade is right or wrong about anything.",
          "The rate is stamped onto each fill as it prints, so a change to the schedule can never reprice a trade you have already taken.",
          "Exchange, clearing and NFA fees sit on top of this at a real firm. Those are not charged here, so the number you see is the floor of what it would cost you and never the ceiling.",
        ],
        related: ["how-fills-are-decided", "position-limits", "open-positions-count"],
      },
      {
        slug: "consistency",
        title: "What is the consistency rule?",
        summary:
          "Your largest winning day has to be half or less of the profit on the account, so one session cannot carry it.",
        body: [
          "Divide your best day by the profit on the account. If it comes out above fifty percent, you have not passed, you have gambled once and got away with it.",
          "The denominator is what you have actually made rather than what you made on your good days, so a losing day pushes the number the wrong way twice.",
          "This one applies while you are proving yourself. Once an account is funded the requirement is gone.",
          "It is shown on the journal and it gates a pass, but it is not a floor. It never ends an account on its own.",
        ],
        related: ["how-many-days", "what-is-not-enforced"],
      },
      {
        slug: "session-hours",
        title: "When does the session close?",
        summary:
          "The trading day is cut at 17:00 Chicago time. Positions are meant to be flat by 16:45 New York time, but nothing here closes them for you.",
        body: [
          "The accounting day rolls at 17:00 Chicago time, which is where your daily loss limit resets and where a new session opens on whatever equity the last one left behind.",
          "A real firm expects you flat by 16:45 New York time, Monday to Friday, and trading reopens at 18:00 New York time, Sunday to Thursday. On a holiday with an early close, the early close is the deadline.",
          "Nothing here closes your position at that deadline, and no order is expired for it. Being flattened at the session close is explicitly not a breach at any firm that sells these accounts, so leaving it unenforced costs you nothing except the realism of watching it happen.",
          "A session opens on where the previous one left the equity, never on where the account stands now. Otherwise a position carried across the roll would move its own daily floor overnight.",
        ],
        related: ["daily-loss-limit-vs-trailing-drawdown", "what-is-not-enforced"],
      },
      {
        slug: "bots-and-copiers",
        title: "Can I use a bot or a trade copier?",
        summary:
          "Yes. What is banned is narrow: cross account hedging, microscalping and high frequency algorithms.",
        body: [
          "Automated systems and copiers are permitted, and so is genuine scalping and averaging into a position.",
          "The bans are aimed at manufacturing a payout rather than at trading: hedging the same instrument across two accounts, microscalping to work against how a simulator fills, and high frequency algorithms.",
          "You carry the consequences of your own software. A bot that breaches the account has breached it.",
          "At a real firm these are flags for a human to look at rather than automatic breaches, and none of them is enforced automatically here either.",
        ],
        related: ["what-is-not-enforced", "how-many-accounts"],
      },
    ],
  },
  {
    slug: "fidelity",
    title: "Where this differs from a real account",
    description:
      "Every place the simulator is not the firm. Worth reading, because a difference you do not know about is the one that misleads you.",
    articles: [
      {
        slug: "bars-not-ticks",
        title: "Are the limits checked on every tick?",
        summary:
          "No. They are read against five second steps of a delayed feed's one minute bars, so the minute that broke a floor is known and the exact second inside it is not.",
        body: [
          "A real firm reads live ticks. This reads the steps the newest candle is revealed in, taking each open position at the worst price inside a step, which is the low if you are long and the high if you are short.",
          "A floor crossed and recovered inside a single minute is still caught, because the minute's extreme is what gets read. What is not known is the instant it happened.",
          "Your peak is ratcheted from the same steps, at the favourable end. A step does not say which end printed first, so its own high is never allowed to drag the floor over its own low.",
          "A firm reading live ticks would have caught you in the same minute. The difference is precision within it, not outcome.",
        ],
        related: [
          "the-dancing-candle",
          "open-positions-count",
          "why-the-trailing-drawdown-is-the-hard-one",
        ],
      },
      {
        slug: "slippage-and-the-queue",
        title: "Is slippage modelled?",
        summary: "No. A limit fills wherever the tape reached it, with nothing in front of it.",
        body: [
          "There is no order queue and no slippage. Your limit fills the moment a bar touches its price, as though you were first in line, and a stop fills at its trigger rather than wherever the market was when it got there.",
          "With commission modelled, this is the last place the simulator is kinder than a broker. In a fast market it is a meaningful difference, and it flatters entries into news and into the open more than anything else.",
        ],
        related: ["how-fills-are-decided", "commission"],
      },
      {
        slug: "news-calendar-reach",
        title: "How far back does the news calendar reach?",
        summary:
          "About a week. A release older than that cannot be judged, so a news breach is only caught close to live.",
        body: [
          "The economic calendar behind the red folder rule holds roughly the last week of releases.",
          "A position held through a release older than that window cannot be checked, because there is nothing left to check it against. In practice this only matters for an account that was not swept while the release was recent.",
        ],
        related: ["red-folder-news", "what-is-not-enforced"],
      },
      {
        slug: "what-is-not-enforced",
        title: "Which rules are published but not enforced?",
        summary:
          "The 16:45 flatten, consistency, cross account hedging, microscalping, the mini position caps, and the daily profit ceiling.",
        body: [
          "Each of these appears on the rules page and is worth knowing, but none of them will stop you or end an account here.",
          "The 16:45 flatten is not enforced because nothing closes a position at the session close. It is explicitly not a breach at any firm, so this costs fidelity rather than correctness.",
          "Consistency is shown and it gates a pass, but it is not a floor that ends an account.",
          "Cross account hedging needs more than one account in view at once. Microscalping and high frequency trading are flags for a human at a real firm rather than automatic breaches.",
          "Only the micro position cap is checked, because the catalog is micros only. The daily profit ceiling moves a trader to live at a real firm, and there is nothing here to be moved to.",
          "Everything else on the rules page is enforced.",
        ],
        related: ["session-hours", "consistency", "position-limits", "bots-and-copiers"],
      },
    ],
  },
];

export const ARTICLES: Article[] = CATEGORIES.flatMap((category) => category.articles);

export const findArticle = (slug: string | undefined) =>
  ARTICLES.find((article) => article.slug === slug) ?? null;

export const categoryOf = (slug: string) =>
  CATEGORIES.find((category) => category.articles.some((article) => article.slug === slug)) ?? null;

/** The handful worth answering before someone has decided to sign up. */
export const HOME_SLUGS = [
  "what-is-propsim",
  "is-it-free",
  "is-real-money-involved",
  "where-prices-come-from",
  "why-the-tape-is-delayed",
  "what-happens-when-you-breach",
];

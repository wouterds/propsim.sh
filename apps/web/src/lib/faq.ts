export type Question = {
  q: string;
  a: string;
};

export type QuestionGroup = {
  title: string;
  questions: Question[];
};

export const FAQ: QuestionGroup[] = [
  {
    title: "What this is",
    questions: [
      {
        q: "What is propsim.sh?",
        a: "A simulated futures account with a prop firm's rules on it. You get a starting balance, a profit target, a daily loss limit and a trailing drawdown, and you trade live CME prices against them. The point is to find out whether you can hold to the rules before you pay a firm to find out for you.",
      },
      {
        q: "Is it free?",
        a: "Yes. There is no fee, no card and no upsell. Firms charge for the evaluation and again for a reset. Here you open as many accounts as you want and start again whenever you want.",
      },
      {
        q: "Is any real money involved?",
        a: "No. Nothing is ordered, nothing is filled at an exchange and there is nothing to withdraw. Every balance on the site is simulated.",
      },
      {
        q: "Do you pay out?",
        a: "No. Passing an account here proves you met the rules. It does not fund you and it is not an application to any firm.",
      },
      {
        q: "Is this a replay of an old session?",
        a: "No. The tape is live and runs on a short delay. A stored session is a test fixture here, not the product.",
      },
    ],
  },
  {
    title: "Trading",
    questions: [
      {
        q: "Where do the prices come from?",
        a: "Live CME futures, on a short delay. The bars you trade are the real ones, a few minutes behind the exchange.",
      },
      {
        q: "Why delayed?",
        a: "Real time exchange data is licensed and expensive. A short delay costs nothing and changes none of what the rules test, because a loss limit does not care when the bar printed.",
      },
      {
        q: "What can I trade?",
        a: "The terminal runs the Micro E-mini Nasdaq today. Support for the rest of the CME futures is what comes next.",
      },
      {
        q: "How are fills decided?",
        a: "Against the delayed tape, at the price on screen. There is no queue model and no slippage yet, so fills here are kinder than a real broker's.",
      },
      {
        q: "Do I need a broker or a platform?",
        a: "No. The terminal runs in the browser. There is nothing to install and no account to connect.",
      },
    ],
  },
  {
    title: "Accounts and rules",
    questions: [
      {
        q: "How many accounts can I open?",
        a: "As many as you like, on any plan, at the same time. Nothing is charged and nothing is throttled.",
      },
      {
        q: "What happens when I breach?",
        a: "Breaching the daily loss limit ends the day. The account reopens with the next session. Breaching the trailing drawdown ends the account for good.",
      },
      {
        q: "Can I start again?",
        a: "Open a new account. A breached one stays in your list so the journal that led to it is still there to read.",
      },
      {
        q: "Why is the trailing drawdown the hard one?",
        a: "It is measured from the highest equity the account has ever reached, so it only ever rises. Go up four hundred and give it back, and the floor keeps the four hundred. It stops climbing once it reaches a hundred above your starting balance, and from then on it never moves again.",
      },
      {
        q: "What is red folder news?",
        a: "A high impact release on the economic calendar: payrolls, CPI, the FOMC rate decision. You have to be flat from a minute before one to a minute after it. On a daily payout account this is a hard breach, so it ends the account rather than the day, and it counts even if the trade was profitable. The terminal shades the window on the chart and warns you while it is open.",
      },
      {
        q: "Does an open position count?",
        a: "Yes. Your equity includes what is still floating, and the limits are checked continuously. A trade that went through the floor at 14:52 does not survive by finishing green.",
      },
    ],
  },
];

export const HOME_QUESTIONS: Question[] = [
  FAQ[0].questions[0],
  FAQ[0].questions[1],
  FAQ[0].questions[2],
  FAQ[1].questions[0],
  FAQ[1].questions[1],
  FAQ[2].questions[1],
];

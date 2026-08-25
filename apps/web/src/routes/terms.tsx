import LegalPage from "~/components/legal/legal-page";
import { CONTACT_EMAIL, OPERATOR, OPERATOR_COUNTRY, UPDATED } from "~/lib/legal";
import { pageMeta } from "~/lib/seo";
import type { Route } from "./+types/terms";

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: "Terms, propsim.sh",
    description:
      "What propsim.sh is and is not, what an account may be used for, and what is not promised.",
    path: "/terms",
  });

const SECTIONS = [
  {
    title: "What this is",
    body: [
      "A simulator. The balances are made up, the fills are made up, and the market data behind them is delayed. No order reaches an exchange, no broker is involved, and there is no money in an account here to win or lose.",
      "It is free. There is nothing to buy, no funded account at the end of it, and no payout, ever.",
    ],
  },
  {
    title: "What it is not",
    body: [
      "It is not advice. Nothing here is a recommendation to trade anything, and passing a simulated account says nothing about how the same decisions would go with money behind them.",
      "It is not affiliated with any prop firm. The rules it enforces are modelled on ones those firms publish, so the practice resembles the real thing, and that is the whole of the relationship.",
    ],
  },
  {
    title: "Your account",
    body: [
      "One person, one account, and an address you can actually receive email at. Keep the password to yourself, and if you think somebody else has it, change it and end the other sessions from the account page.",
      "Simulated accounts inside it can be reset or removed. One that has not been traded in thirty days is deleted, as the rules page says.",
      "The account itself is yours to end. The settings page deletes it, and there is no waiting on anybody to do it for you.",
    ],
  },
  {
    title: "What not to do with it",
    body: [
      "Do not hammer it with automated requests, do not try to break it or get at anybody else's account, and do not resell access to it. Anything that costs other people the service is what this line is about.",
    ],
  },
  {
    title: "What is not promised",
    body: [
      "It is provided as it stands. It may change, it may be down, the market data may be wrong or missing, and the whole thing may stop. None of that is compensable, because nothing was paid for it.",
      "The prices come from third parties on a delay and are not fit to trade on anywhere else.",
    ],
  },
  {
    title: "Liability",
    body: [
      "As far as the law allows, there is no liability for anything that follows from using this, including decisions you go on to make with real money elsewhere. Nothing here removes rights you have as a consumer that cannot be signed away.",
    ],
  },
  {
    title: "The law behind this",
    body: [
      `${OPERATOR} is run from ${OPERATOR_COUNTRY}, and these terms run under the law of ${OPERATOR_COUNTRY}. If you are a consumer somewhere else, the protections your own country gives you still apply.`,
      `Questions go to ${CONTACT_EMAIL}.`,
    ],
  },
];

const Terms = () => (
  <LegalPage
    title="Terms"
    updated={UPDATED}
    intro="Free, simulated, and not a broker. That is most of it, but the rest is written out here so it is on the record."
    sections={SECTIONS}
  />
);

export default Terms;

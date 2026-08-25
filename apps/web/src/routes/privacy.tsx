import LegalPage from "~/components/legal/legal-page";
import { CONTACT_EMAIL, OPERATOR, OPERATOR_COUNTRY, UPDATED } from "~/lib/legal";
import { pageMeta } from "~/lib/seo";
import type { Route } from "./+types/privacy";

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: "Privacy, propsim.sh",
    description:
      "What propsim.sh keeps, why it keeps it, who else sees it, and how to have it deleted.",
    path: "/privacy",
  });

const SECTIONS = [
  {
    title: "Who answers for this",
    body: [
      `${OPERATOR} is run from ${OPERATOR_COUNTRY} and is the controller of everything described here. Write to ${CONTACT_EMAIL} about anything on this page, deleting your account included.`,
      "That last one you can also do yourself, without asking: the settings page has a button for it, and it takes effect the moment you confirm.",
    ],
  },
  {
    title: "What is kept",
    body: [
      "Your email address, and your password stored as a hash that cannot be turned back into the password.",
      "One record for each device you sign in from: the browser, the operating system, whether it is a phone or a desktop, the IP address of the request and the country it resolves to, and when it was last used. The account page lists these so you can end a session you do not recognise.",
      "A cookie holding the chart and the order ticket you last had open, so the terminal opens where you left it.",
      "Whatever you type into the contact form, which arrives as an email.",
      "There is no payment data, because nothing here costs anything. There are no identity documents, no trading history at a broker, and no real money.",
    ],
  },
  {
    title: "Why it is kept",
    body: [
      "The address and the password run the account. The device records exist so a session can be ended and so a sign-in from somewhere new can be reported to you. The preference cookie exists so the terminal is not reset on every visit. A contact message is kept for as long as it takes to answer it.",
      "In the language of the GDPR: running the account is performance of a contract, the device records and the sign-in emails are a legitimate interest in keeping the account secure, and the contact form is your own request.",
    ],
  },
  {
    title: "Who else sees it",
    body: [
      "Mailjet sends the email, so it sees the address a message goes to and what is in it. Cloudflare sits in front of the site and sees every request, including its IP address. The database runs on hardware operated by us and is not shared with anyone.",
      "Nothing is sold, rented, or handed to advertisers. There is no analytics, no tracking pixel, and no third-party script following you between sites.",
    ],
  },
  {
    title: "Cookies",
    body: [
      "Three, all of them necessary: one that keeps you signed in, one that remembers the chart and ticket, and a short-lived one that only exists during a sign-in with Google. None of them tracks you, which is why there is no banner asking about them.",
    ],
  },
  {
    title: "How long",
    body: [
      "A session expires thirty days after it was opened, or after fourteen days of not being used, whichever comes first. Ending a session or changing your password removes them sooner.",
      "The rest is kept for as long as the account exists. Deleting it takes your address off it at once, replacing it with one that reaches nobody and stamping the date, and what is left behind cannot be traced back to you or to the address it used to hold. That address is free to open a new account with.",
    ],
  },
  {
    title: "What you can ask for",
    body: [
      "Deletion is the one you can do without asking: the settings page has a button for it, and it takes effect the moment you confirm.",
      `For a copy of what is held, a correction, or an objection to any of it, email ${CONTACT_EMAIL} and it is done by hand, without a form to fill in. If the answer is unsatisfactory you can complain to the data protection authority where you live.`,
    ],
  },
];

const Privacy = () => (
  <LegalPage
    title="Privacy"
    updated={UPDATED}
    intro="A simulator needs very little about you, so this stays short. It says what is kept, why, who else sees it, and how to have it removed."
    sections={SECTIONS}
  />
);

export default Privacy;

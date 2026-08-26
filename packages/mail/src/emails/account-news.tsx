import { Heading, Text } from "@react-email/components";
import { ButtonLink, Callout, heading, Layout, paragraph } from "../layout";

export type AccountNewsProps = {
  to: string;
  account: string;
  /** Where to read the session that ended it. */
  href: string;
  /** What was printing, so the mail names the release rather than the window. */
  release: string;
  at: string;
};

export const AccountNews = ({ to, account, href, release, at }: AccountNewsProps) => (
  <Layout
    preview={`${account} was not flat for ${release}`}
    footnote="You are receiving this because an account you opened was closed by one of its rules."
    to={to}
  >
    <Heading style={heading}>{account} is breached</Heading>
    <Callout label="Red folder news">
      It was holding a position through {release} at {at}. A daily payout account has to be flat
      from a minute before a red folder release until a minute after it, and trading through one
      ends the account whether the trade won or lost.
    </Callout>
    <Text style={paragraph}>
      Opening inside the window counts the same as carrying one in. The rule is to be flat, not to
      finish the window in profit.
    </Text>
    <ButtonLink href={href}>View account</ButtonLink>
    <Text style={{ ...paragraph, margin: "16px 0 16px" }}>
      Nothing was ordered and no money was at stake. The terminal shades the window on the chart and
      counts down to it, so the next one does not have to be a surprise.
    </Text>
  </Layout>
);

export default AccountNews;

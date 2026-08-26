import { Heading, Text } from "@react-email/components";
import { ButtonLink, heading, Layout, paragraph, SITE } from "../layout";

export type AccountBreachedProps = {
  to: string;
  account: string;
  /** The deepest the equity went, which is where the position was flattened. */
  equity: string;
  /** The level that ended it. */
  floor: string;
};

export const AccountBreached = ({ to, account, equity, floor }: AccountBreachedProps) => (
  <Layout
    preview={`${account} hit the trailing drawdown`}
    footnote="You are receiving this because an account you opened was closed by one of its rules."
    to={to}
  >
    <Heading style={heading}>{account} is closed</Heading>
    <Text style={paragraph}>
      It hit the trailing drawdown. That floor follows your peak equity up and never comes back
      down, and it is the only one that ends an account rather than a day.
    </Text>
    <Text style={paragraph}>
      The floor was {floor} and the account reached {equity}. Everything it was holding has been
      closed and every working order cancelled.
    </Text>
    <ButtonLink href={`${SITE}/accounts/new`}>Open a new account</ButtonLink>
    <Text style={{ ...paragraph, margin: "16px 0 16px" }}>
      Nothing was ordered and no money was at stake. The account stays readable, so the session that
      ended it is still there to go back over.
    </Text>
  </Layout>
);

export default AccountBreached;

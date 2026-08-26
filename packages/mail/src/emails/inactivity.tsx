import { Heading, Text } from "@react-email/components";
import { ButtonLink, Callout, heading, Layout, paragraph, SITE } from "../layout";

export type InactivityProps = {
  to: string;
  daysLeft: number;
};

export const Inactivity = ({ to, daysLeft }: InactivityProps) => (
  <Layout
    preview={`Your propsim.sh account will be deleted in ${daysLeft} days`}
    footnote="You are receiving this because nobody has signed in to this account for a while."
    to={to}
  >
    <Heading style={heading}>Nobody has signed in for a while</Heading>
    <Callout label={`Deleted in ${daysLeft} days`}>
      Signing in is all it takes to keep it, and the clock starts again from there.
    </Callout>
    <ButtonLink href={`${SITE}/auth`}>Sign in</ButtonLink>
    <Text style={{ ...paragraph, margin: "16px 0 16px" }}>
      If you are done with it, there is nothing to do. On the day it goes, your address comes off
      the account and what is left behind cannot be traced back to you.
    </Text>
  </Layout>
);

export default Inactivity;

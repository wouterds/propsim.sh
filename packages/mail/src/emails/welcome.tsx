import { Heading, Text } from "@react-email/components";
import { ButtonLink, heading, Layout, paragraph, SITE } from "../layout";

export type WelcomeProps = {
  to: string;
};

export const Welcome = ({ to }: WelcomeProps) => (
  <Layout
    preview="Your propsim.sh account is ready."
    footnote="You are receiving this because you created a propsim.sh account."
    to={to}
  >
    <Heading style={heading}>Your account is ready</Heading>
    <Text style={paragraph}>
      Your simulated account carries Lucid Trading&apos;s LucidDaily rules, number for number. A
      daily loss limit measured from the equity you open the session with, and a trailing drawdown
      measured from the highest equity the account has ever reached.
    </Text>
    <Text style={paragraph}>
      You trade live market data on a short delay. The dashboard shows both limits and how much room
      is left against them.
    </Text>
    <ButtonLink href={`${SITE}/dash`}>Open your dashboard</ButtonLink>
  </Layout>
);

export default Welcome;

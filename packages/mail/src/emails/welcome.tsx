import { Button, Heading, Text } from "@react-email/components";
import { button, heading, Layout, paragraph, SITE } from "../layout";

export type WelcomeProps = {
  to: string;
};

export const Welcome = ({ to }: WelcomeProps) => (
  <Layout
    preview="Your propsim account is ready."
    footnote="You are receiving this because you created a propsim account."
    to={to}
  >
    <Heading style={heading}>Your account is ready</Heading>
    <Text style={paragraph}>
      Your simulated account carries the rules a funded account runs on. A daily loss limit measured
      from the balance you open the day with, and a trailing drawdown measured from the highest
      equity the account has ever reached.
    </Text>
    <Text style={paragraph}>
      You trade live market data on a short delay. The dashboard shows both limits and how much room
      is left against them.
    </Text>
    <Button style={button} href={`${SITE}/dash`}>
      Open your dashboard
    </Button>
  </Layout>
);

export default Welcome;

import { Button, Heading, Text } from "@react-email/components";
import { button, heading, Layout, paragraph, SITE } from "../layout";

export const Welcome = () => (
  <Layout
    preview="Your propsim account is ready."
    footnote="You are receiving this because you created a propsim account."
  >
    <Heading style={heading}>Your account is ready</Heading>
    <Text style={paragraph}>
      propsim gives you a simulated futures account with a prop firm's rules on it. You trade live
      market data on a short delay, and every fill runs against a daily loss limit and a trailing
      drawdown.
    </Text>
    <Text style={paragraph}>
      Your dashboard shows the balance, both limits, and how much room is left against them.
    </Text>
    <Button style={button} href={`${SITE}/dash`}>
      Open your dashboard
    </Button>
  </Layout>
);

export default Welcome;

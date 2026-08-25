import { Button, Heading, Text } from "@react-email/components";
import { button, heading, Layout, paragraph } from "../layout";

export const Welcome = () => (
  <Layout preview="Your propsim account is ready.">
    <Heading style={heading}>Welcome to propsim</Heading>
    <Text style={paragraph}>
      Your account is ready. propsim trades a live futures tape against a prop firm's account rules,
      so the rules that end a funded account cost nothing to meet.
    </Text>
    <Text style={paragraph}>Nothing is ordered and no money is at stake.</Text>
    <Button style={button} href="https://propsim.sh/dashboard">
      Open the dashboard
    </Button>
  </Layout>
);

export default Welcome;

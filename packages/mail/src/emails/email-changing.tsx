import { Heading, Text } from "@react-email/components";
import { heading, Layout, paragraph } from "../layout";

export type EmailChangingProps = {
  to: string;
  email: string;
};

export const EmailChanging = ({ to, email }: EmailChangingProps) => (
  <Layout
    preview="A new address was requested for your propsim.sh account"
    footnote="You are receiving this because you are the address currently on the account."
    to={to}
  >
    <Heading style={heading}>Somebody asked to move this account</Heading>
    <Text style={paragraph}>
      A request was made to change the address on your account to {email}. Nothing has moved yet.
      The account keeps this address until the new one is confirmed.
    </Text>
    <Text style={paragraph}>
      If this was not you, reply to this message and change your password. Somebody else knows it.
    </Text>
  </Layout>
);

export default EmailChanging;

import { Heading, Text } from "@react-email/components";
import { heading, Layout, paragraph } from "../layout";

export type PasswordChangedProps = {
  to: string;
};

export const PasswordChanged = ({ to }: PasswordChangedProps) => (
  <Layout
    preview="Your propsim.sh password was changed"
    footnote="You are receiving this because the password on this account changed."
    to={to}
  >
    <Heading style={heading}>Your password was changed</Heading>
    <Text style={paragraph}>
      Every other device has been signed out. If this was you, there is nothing to do.
    </Text>
    <Text style={paragraph}>
      If it was not, somebody else can reach your account. Reset the password from the login page to
      take it back and sign every device out.
    </Text>
  </Layout>
);

export default PasswordChanged;

import { Heading, Text } from "@react-email/components";
import { heading, Layout, paragraph } from "../layout";

export type AccountDeletedProps = {
  to: string;
};

export const AccountDeleted = ({ to }: AccountDeletedProps) => (
  <Layout
    preview="Your propsim.sh account was deleted"
    footnote="You are receiving this because the account on this address was deleted."
    to={to}
  >
    <Heading style={heading}>Your account was deleted</Heading>
    <Text style={paragraph}>
      Everything it held is gone and every device has been signed out. This address is free again,
      so you can start over with it whenever you want.
    </Text>
    <Text style={paragraph}>
      If this was not you, somebody had your session. Nothing can be recovered, but start a new
      account with a password you have not used anywhere else.
    </Text>
  </Layout>
);

export default AccountDeleted;

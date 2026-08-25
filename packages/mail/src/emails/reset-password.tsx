import { Heading, Text } from "@react-email/components";
import { ButtonLink, heading, Layout, paragraph, SITE } from "../layout";

export type ResetPasswordProps = {
  to: string;
  token: string;
  expiresInMinutes: number;
};

export const ResetPassword = ({ to, token, expiresInMinutes }: ResetPasswordProps) => (
  <Layout
    preview="Choose a new propsim.sh password"
    footnote="You are receiving this because somebody asked to reset the password on this address."
    to={to}
  >
    <Heading style={heading}>Choose a new password</Heading>
    <Text style={paragraph}>Use the button to set a new password on your account.</Text>
    <ButtonLink href={`${SITE}/reset?token=${token}`}>Choose a new password</ButtonLink>
    <Text style={{ ...paragraph, margin: "16px 0 0" }}>
      The link works once and expires in {expiresInMinutes} minutes. If you did not ask for this,
      nothing has happened and your password has not changed.
    </Text>
  </Layout>
);

export default ResetPassword;

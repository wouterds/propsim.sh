import { Heading, Text } from "@react-email/components";
import { ButtonLink, heading, Layout, paragraph, SITE } from "../layout";

export type ConfirmNewEmailProps = {
  to: string;
  token: string;
  expiresInMinutes: number;
};

export const ConfirmNewEmail = ({ to, token, expiresInMinutes }: ConfirmNewEmailProps) => (
  <Layout
    preview="Confirm your new propsim.sh address"
    footnote="You are receiving this because this address was given as the new one for a propsim.sh account."
    to={to}
  >
    <Heading style={heading}>Confirm this address</Heading>
    <Text style={paragraph}>Your account keeps its old address until you confirm this one.</Text>
    <ButtonLink href={`${SITE}/email?token=${token}`}>Confirm this address</ButtonLink>
    <Text style={{ ...paragraph, margin: "16px 0 0" }}>
      The link works once and expires in {expiresInMinutes} minutes. If you were not expecting it,
      ignore this message and nothing changes.
    </Text>
  </Layout>
);

export default ConfirmNewEmail;

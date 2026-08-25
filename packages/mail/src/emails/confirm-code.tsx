import { Heading, Text } from "@react-email/components";
import { ButtonLink, digits, heading, Layout, paragraph, SITE } from "../layout";

export type ConfirmCodeProps = {
  to: string;
  code: string;
  expiresInMinutes: number;
};

export const ConfirmCode = ({ to, code, expiresInMinutes }: ConfirmCodeProps) => (
  // The preview line feeds the inbox list and iOS autofill, but it is stripped from
  // the plain text part. Keep the code in the body text as well.
  <Layout
    preview={`${code} is your propsim.sh confirmation code`}
    footnote="You are receiving this because somebody entered this address when creating a propsim.sh account. If that was not you, no account has been activated and you can ignore this message."
    to={to}
  >
    <Heading style={heading}>Confirm your email address</Heading>
    <Text style={paragraph}>Confirm with the button, or enter the code yourself.</Text>
    <Text style={digits}>{code}</Text>
    <ButtonLink href={`${SITE}/verify?code=${code}`}>Confirm my email</ButtonLink>
    <Text style={{ ...paragraph, margin: "16px 0 16px" }}>
      The code expires in {expiresInMinutes} minutes and can be used once. The button only works in
      the browser you signed up with.
    </Text>
  </Layout>
);

export default ConfirmCode;

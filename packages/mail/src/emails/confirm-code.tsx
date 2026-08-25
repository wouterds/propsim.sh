import { Heading, Text } from "@react-email/components";
import { digits, heading, Layout, paragraph, warning } from "../layout";

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
    <Text style={paragraph}>Enter this code to finish creating your account.</Text>
    <Text style={digits}>{code}</Text>
    <Text style={paragraph}>
      The code expires in {expiresInMinutes} minutes and can be used once.
    </Text>
    <Text style={warning}>propsim.sh will never ask you for this code.</Text>
  </Layout>
);

export default ConfirmCode;

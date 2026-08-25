import { Heading, Text } from "@react-email/components";
import { digits, heading, Layout, paragraph } from "../layout";

export type ConfirmCodeProps = {
  code: string;
  expiresInMinutes: number;
};

export const ConfirmCode = ({ code, expiresInMinutes }: ConfirmCodeProps) => (
  // The preview line feeds the inbox list and iOS autofill, but it is stripped from
  // the plain text part. Keep the code in the body text as well.
  <Layout
    preview={`${code} is your propsim confirmation code`}
    footnote="If you did not create a propsim account, you can ignore this email."
  >
    <Heading style={heading}>Confirm your email address</Heading>
    <Text style={paragraph}>Enter this code to finish creating your account.</Text>
    <Text style={digits}>{code}</Text>
    <Text style={paragraph}>
      The code expires in {expiresInMinutes} minutes and can be used once.
    </Text>
  </Layout>
);

export default ConfirmCode;

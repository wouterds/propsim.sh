import { Heading, Text } from "@react-email/components";
import { digits, heading, Layout, paragraph } from "../layout";

export type ConfirmCodeProps = {
  code: string;
  expiresInMinutes: number;
};

export const ConfirmCode = ({ code, expiresInMinutes }: ConfirmCodeProps) => (
  // The preview line feeds the inbox list and iOS autofill, but it is stripped from
  // the plain text part. Keep the code in the body text as well.
  <Layout preview={`${code} is your propsim confirmation code`}>
    <Heading style={heading}>Confirm your email</Heading>
    <Text style={paragraph}>Enter this code to confirm your address:</Text>
    <Text style={digits}>{code}</Text>
    <Text style={paragraph}>
      The code expires in {expiresInMinutes} minutes and works one time. If you did not create a
      propsim account, ignore this mail.
    </Text>
  </Layout>
);

export default ConfirmCode;

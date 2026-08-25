import { Heading, Text } from "@react-email/components";
import { ButtonLink, heading, Layout, paragraph, SITE } from "../layout";

export type NewDeviceProps = {
  to: string;
  device: string;
  place: string | null;
  at: string;
};

export const NewDevice = ({ to, device, place, at }: NewDeviceProps) => (
  <Layout
    preview={`${device} signed in to your propsim.sh account`}
    footnote="You are receiving this because a device that had not signed in before did."
    to={to}
  >
    <Heading style={heading}>A new device signed in</Heading>
    <Text style={paragraph}>
      {device}
      {place ? ` from ${place}` : ""}, on {at}.
    </Text>
    <Text style={paragraph}>If that was you, there is nothing to do.</Text>
    <ButtonLink href={`${SITE}/settings`}>Review your devices</ButtonLink>
    <Text style={{ ...paragraph, margin: "16px 0 16px" }}>
      If it was not you, sign that device out from the page above and change your password.
    </Text>
  </Layout>
);

export default NewDevice;

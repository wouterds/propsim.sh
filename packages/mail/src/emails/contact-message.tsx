import { Heading, Text } from "@react-email/components";
import { heading, Layout, paragraph } from "../layout";

export type ContactMessageProps = {
  to: string;
  name: string;
  email: string;
  subject: string;
  message: string;
};

const label = {
  color: "#7b8493",
  fontSize: "11px",
  letterSpacing: "0.08em",
  margin: "0 0 4px",
  textTransform: "uppercase",
} as const;

const value = { ...paragraph, margin: "0 0 16px" };

export const ContactMessage = ({ to, name, email, subject, message }: ContactMessageProps) => (
  <Layout
    preview={`${name}: ${subject}`}
    footnote="You are receiving this because somebody used the contact form on propsim.sh."
    to={to}
  >
    <Heading style={heading}>{subject}</Heading>

    <Text style={label}>From</Text>
    <Text style={value}>
      {name} · {email}
    </Text>

    <Text style={label}>Message</Text>
    {message.split("\n\n").map((block) => (
      <Text key={block} style={{ ...value, whiteSpace: "pre-wrap" }}>
        {block}
      </Text>
    ))}

    <Text style={{ ...paragraph, margin: "8px 0 16px" }}>Reply to reach them directly.</Text>
  </Layout>
);

export default ContactMessage;

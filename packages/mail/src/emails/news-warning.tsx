import { Heading, Text } from "@react-email/components";
import { ButtonLink, Callout, heading, Layout, paragraph, SITE } from "../layout";

export type NewsWarningProps = {
  to: string;
  /** What is printing, in the order the calendar lists it. */
  releases: string[];
  /** The release, on a Chicago clock. */
  at: string;
  date: string;
  /** The window, on the same clock. Both edges count as inside it. */
  opens: string;
  closes: string;
};

const box: React.CSSProperties = {
  backgroundColor: "#0a0b0d",
  border: "1px solid #22262d",
  borderRadius: "8px",
  margin: "0 0 20px",
  padding: "14px 16px",
};

const label: React.CSSProperties = {
  color: "#7b8493",
  fontSize: "11px",
  letterSpacing: "0.08em",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const value: React.CSSProperties = {
  color: "#e6eaf0",
  fontSize: "15px",
  fontWeight: 600,
  margin: "0 0 14px",
};

const window: React.CSSProperties = {
  ...value,
  color: "#ffb020",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  margin: 0,
};

export const NewsWarning = ({ to, releases, at, date, opens, closes }: NewsWarningProps) => (
  <Layout
    preview={`Be flat from ${opens} to ${closes} Chicago time`}
    footnote="You are receiving this because you have an account open that a release can breach."
    to={to}
  >
    <Heading style={heading}>Red folder news in an hour</Heading>

    <Callout label="News trading is not permitted">
      Holding a position through a high impact release ends the account. So does opening one inside
      the window. The rule is to be flat, not to finish the window in profit.
    </Callout>

    <div style={box}>
      <Text style={label}>Releasing</Text>
      <Text style={value}>{releases.join(", ")}</Text>

      <Text style={label}>When</Text>
      <Text style={value}>
        {date}, {at} Chicago time
      </Text>

      <Text style={label}>Be flat between</Text>
      <Text style={window}>
        {opens} and {closes}
      </Text>
    </div>

    <Text style={paragraph}>
      The terminal shades the window on the chart and counts down to it, so there is no calendar to
      keep in another tab.
    </Text>

    <ButtonLink href={`${SITE}/dash`}>Check your positions</ButtonLink>

    <Text style={{ ...paragraph, margin: "16px 0 16px" }}>
      Nothing here stops you trading into it. Being stopped would hide the rule, and finding out
      what the rule costs is what this account is for.
    </Text>
  </Layout>
);

export default NewsWarning;

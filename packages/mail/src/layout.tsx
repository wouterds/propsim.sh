import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

export const SITE = "https://propsim.sh";

// The app palette. An email that does not look like the product it came from
// reads as a phishing attempt.
const INK = "#e6eaf0";
const MUTED = "#98a1b2";
const FAINT = "#7b8493";
const BASE = "#0a0b0d";
const RAISED = "#101216";
const LINE = "#22262d";
const ACCENT = "#ffffff";

const body: CSSProperties = {
  backgroundColor: BASE,
  color: INK,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "32px 12px",
};

const container: CSSProperties = {
  backgroundColor: RAISED,
  border: `1px solid ${LINE}`,
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "480px",
  padding: "32px",
};

const brand: CSSProperties = {
  borderCollapse: "collapse",
  marginBottom: "28px",
};

const wordmark: CSSProperties = {
  color: INK,
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
};

const suffix: CSSProperties = {
  color: FAINT,
};

const rule: CSSProperties = {
  border: "none",
  borderTop: `1px solid ${LINE}`,
  margin: "32px 0 20px",
};

const footer: CSSProperties = {
  color: FAINT,
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
};

const footerLink: CSSProperties = {
  color: FAINT,
  textDecoration: "underline",
};

export const heading: CSSProperties = {
  color: INK,
  fontSize: "20px",
  fontWeight: 600,
  lineHeight: "28px",
  margin: "0 0 16px",
};

export const paragraph: CSSProperties = {
  color: MUTED,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

export const digits: CSSProperties = {
  backgroundColor: BASE,
  border: `1px solid ${LINE}`,
  borderRadius: "8px",
  color: INK,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "32px",
  fontWeight: 700,
  letterSpacing: "10px",
  margin: "0 0 20px",
  padding: "16px 0 16px 10px",
  textAlign: "center",
};

export const warning: CSSProperties = {
  color: FAINT,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 16px",
};

export const button: CSSProperties = {
  backgroundColor: ACCENT,
  borderRadius: "6px",
  color: BASE,
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 20px",
  textDecoration: "none",
};

const UP = "#14b8a6";
const DOWN = "#f43f5e";

type CandleProps = {
  color: string;
  top: number;
  wick: number;
  body: number;
};

const Candle = ({ color, top, wick, body }: CandleProps) => (
  <td style={{ padding: "0 0.5px", verticalAlign: "top" }}>
    <div style={{ height: `${top}px`, lineHeight: "1px", fontSize: "1px" }}>&nbsp;</div>
    <div style={{ width: "1px", height: `${wick}px`, backgroundColor: color, margin: "0 auto" }} />
    <div
      style={{ width: "4px", height: `${body}px`, backgroundColor: color, borderRadius: "1px" }}
    />
    <div style={{ width: "1px", height: `${wick}px`, backgroundColor: color, margin: "0 auto" }} />
  </td>
);

const Mark = () => (
  <table cellPadding={0} cellSpacing={0} role="presentation" style={{ borderCollapse: "collapse" }}>
    <tbody>
      <tr>
        <Candle color={DOWN} top={7} wick={2} body={5} />
        <Candle color={UP} top={3} wick={2} body={7} />
        <Candle color={DOWN} top={4} wick={2} body={5} />
      </tr>
    </tbody>
  </table>
);

type LayoutProps = {
  preview: string;
  footnote: string;
  to: string;
  children: ReactNode;
};

export const Layout = ({ preview, footnote, to, children }: LayoutProps) => (
  <Html lang="en">
    <Head>
      {/* Without these a client treats the dark palette as light and inverts it. */}
      <meta name="color-scheme" content="dark" />
      <meta name="supported-color-schemes" content="dark" />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={body}>
      <Container style={container}>
        <table cellPadding={0} cellSpacing={0} role="presentation" style={brand}>
          <tbody>
            <tr>
              <td style={{ paddingRight: "8px", verticalAlign: "middle" }}>
                <Mark />
              </td>
              <td style={{ verticalAlign: "middle" }}>
                <span style={wordmark}>
                  propsim<span style={suffix}>.sh</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {children}

        <Section>
          <Hr style={rule} />
          <Text style={footer}>
            {footnote}
            <br />
            Sent to {to} by{" "}
            <Link href={SITE} style={footerLink}>
              propsim.sh
            </Link>
            , a trading simulator. Nothing is ordered and no money is at stake.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

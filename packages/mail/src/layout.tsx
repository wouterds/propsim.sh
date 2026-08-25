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

const wordmark: CSSProperties = {
  color: INK,
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  margin: "0 0 28px",
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
  padding: "16px 0",
  textAlign: "center",
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

type LayoutProps = {
  preview: string;
  footnote: string;
  children: ReactNode;
};

export const Layout = ({ preview, footnote, children }: LayoutProps) => (
  <Html lang="en">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={body}>
      <Container style={container}>
        <Text style={wordmark}>
          propsim<span style={suffix}>.sh</span>
        </Text>

        {children}

        <Section>
          <Hr style={rule} />
          <Text style={footer}>
            {footnote}
            <br />
            propsim is a trading simulator. Nothing is ordered and no money is at stake.{" "}
            <Link href={SITE} style={footerLink}>
              propsim.sh
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

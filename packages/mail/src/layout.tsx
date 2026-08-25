import { Body, Container, Head, Html, Preview, Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

const body: CSSProperties = {
  backgroundColor: "#09090b",
  color: "#e4e4e7",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "32px 0",
};

const container: CSSProperties = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "480px",
  padding: "32px",
};

const footer: CSSProperties = {
  color: "#52525b",
  fontSize: "13px",
  margin: "24px 0 0",
};

export const heading: CSSProperties = {
  color: "#fafafa",
  fontSize: "22px",
  fontWeight: 600,
  margin: "0 0 16px",
};

export const paragraph: CSSProperties = {
  color: "#a1a1aa",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

export const digits: CSSProperties = {
  color: "#fafafa",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "34px",
  fontWeight: 700,
  letterSpacing: "8px",
  margin: "0 0 16px",
  textAlign: "center",
};

export const button: CSSProperties = {
  backgroundColor: "#fafafa",
  borderRadius: "6px",
  color: "#09090b",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 20px",
  textDecoration: "none",
};

type LayoutProps = {
  preview: string;
  children: ReactNode;
};

export const Layout = ({ preview, children }: LayoutProps) => (
  <Html lang="en">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={body}>
      <Container style={container}>
        {children}
        <Text style={footer}>propsim.sh</Text>
      </Container>
    </Body>
  </Html>
);

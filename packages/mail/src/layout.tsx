import { Body, Container, Head, Html, Link, Preview, Section, Text } from "@react-email/components";
import type { CSSProperties, ReactNode, TdHTMLAttributes } from "react";

export const SITE = "https://propsim.sh";

// The app palette. An email that does not look like the product it came from
// reads as a phishing attempt.
const INK = "#e6eaf0";
const MUTED = "#98a1b2";
const FAINT = "#7b8493";
const DIM = "#5a626e";
const BASE = "#0a0b0d";
const RAISED = "#101216";
const LINE = "#22262d";
// blue-600, the fill a primary button carries on the site. A mail that looks
// like the product it came from is one less thing that reads as phishing.
const ACCENT = "#2563eb";
const UP = "#14b8a6";
const DOWN = "#f43f5e";

const body: CSSProperties = {
  backgroundColor: BASE,
  height: "100%",
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
  padding: "32px 32px 16px",
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

// Under the card, on the page's own background, at the weight of a signature.
const footer: CSSProperties = {
  color: DIM,
  fontSize: "11px",
  lineHeight: "17px",
  boxSizing: "border-box",
  margin: "16px auto 0",
  maxWidth: "480px",
  // The card's own padding plus its border, so the two blocks of text share a
  // left edge rather than the footer starting at the card's outer corner.
  padding: "0 33px",
};

// No underline and the same colour as the line it sits in: the address only
// turns blue when a client decides it is a link nobody styled.
const footerLink: CSSProperties = {
  color: DIM,
  textDecoration: "none",
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

const buttonCell: CSSProperties = {
  backgroundColor: ACCENT,
  // A gradient of one colour, because a client that repaints backgrounds for
  // dark mode leaves images alone. Without it the white cell is darkened and
  // the dark label on it disappears.
  backgroundImage: `linear-gradient(${ACCENT}, ${ACCENT})`,
  borderRadius: "6px",
};

// React dropped `bgcolor` from its types. Clients still read it, and Apple Mail
// in dark mode drops a white background that is only set in CSS.
const fill = { bgcolor: ACCENT } as TdHTMLAttributes<HTMLTableDataCellElement>;

const buttonLabel: CSSProperties = {
  color: INK,
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 20px",
  textDecoration: "none",
};

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
};

/**
 * The fill is set twice, as an attribute and in CSS. Apple Mail in dark mode
 * drops the CSS one and the dark label goes invisible on the dark card.
 */
export const ButtonLink = ({ href, children }: ButtonLinkProps) => (
  <table cellPadding={0} cellSpacing={0} role="presentation" style={{ borderCollapse: "separate" }}>
    <tbody>
      <tr>
        <td {...fill} style={buttonCell}>
          <Link href={href} style={buttonLabel}>
            <span style={{ color: INK }}>{children}</span>
          </Link>
        </td>
      </tr>
    </tbody>
  </table>
);

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
      {/* The inline background stops where the content does. The page itself has
          to carry it, or the client shows its own below the last row. */}
      <style>{`html,body{margin:0!important;padding:0!important;height:100%!important;width:100%!important;background-color:${BASE}!important;}`}</style>
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
      </Container>

      <Section>
        <Text style={footer}>
          {footnote}
          <br />
          Sent to{" "}
          <Link href={`mailto:${to}`} style={footerLink}>
            {to}
          </Link>{" "}
          by{" "}
          <Link href={SITE} style={footerLink}>
            propsim.sh
          </Link>
          , a trading simulator. Nothing is ordered and no money is at stake.
        </Text>
      </Section>
    </Body>
  </Html>
);

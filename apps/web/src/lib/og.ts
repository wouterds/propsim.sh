export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export type Stat = { label: string; value: string; tone?: "up" | "down" | "plain" };

export type Card = {
  name: string;
  /** What sits under the name, such as how long they have been trading. */
  since: string;
  initials: string;
  hue: number;
  stats: Stat[];
};

/** The tokens the site uses, written out because a canvas cannot read a `var()`. */
const INK = "#e6e9ef";
const MUTED = "#9aa3b2";
const FAINT = "#7b8493";
const BASE = "#0a0b0d";
const RAISED = "#111318";
const LINE = "#22262d";
const UP = "#14b8a6";
const DOWN = "#f43f5e";

const TONE = { up: UP, down: DOWN, plain: INK };

/** XML, so a name with an ampersand in it cannot end the document early. */
const xml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * A name has no width until it is drawn, and there is no measuring here, so it
 * is cut to what the card can hold at the size it is set in.
 */
const clip = (value: string, at: number) =>
  value.length <= at ? value : `${value.slice(0, at - 1).trimEnd()}…`;

/**
 * The card a link to a profile unfurls as. Built as a string rather than with a
 * layout engine: it is four boxes and some text, and the engine would be a
 * dependency the size of the rest of the page.
 */
export const traderCard = ({ name, since, initials, hue, stats }: Card) => {
  const columns = stats.slice(0, 4);
  const width = 260;
  const gap = 24;
  const left = 80;
  const top = 340;

  const blocks = columns
    .map((stat, index) => {
      const x = left + index * (width + gap);

      return `
    <rect x="${x}" y="${top}" width="${width}" height="170" rx="16" fill="${RAISED}" stroke="${LINE}"/>
    <text x="${x + 28}" y="${top + 50}" font-family="sans-serif" font-size="20" letter-spacing="1.5" fill="${FAINT}">${xml(stat.label.toUpperCase())}</text>
    <text x="${x + 28}" y="${top + 116}" font-family="sans-serif" font-size="44" font-weight="600" fill="${TONE[stat.tone ?? "plain"]}">${xml(stat.value)}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
    <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${BASE}"/>
    <rect x="0" y="0" width="${OG_WIDTH}" height="4" fill="${UP}"/>

    <circle cx="140" cy="150" r="60" fill="oklch(0.36 0.04 ${hue})" stroke="oklch(0.46 0.045 ${hue})" stroke-width="2"/>
    <text x="140" y="168" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="600" fill="oklch(0.86 0.055 ${hue})">${xml(initials)}</text>

    <text x="228" y="138" font-family="sans-serif" font-size="58" font-weight="600" fill="${INK}">${xml(clip(name, 24))}</text>
    <text x="228" y="186" font-family="sans-serif" font-size="26" fill="${MUTED}">${xml(clip(since, 60))}</text>

    <text x="80" y="272" font-family="sans-serif" font-size="24" letter-spacing="2" fill="${FAINT}">PROPSIM.SH</text>
    <line x1="80" y1="296" x2="${OG_WIDTH - 80}" y2="296" stroke="${LINE}" stroke-width="2"/>
    ${blocks}
  </svg>`;
};

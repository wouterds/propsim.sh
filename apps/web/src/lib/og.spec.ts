import { describe, expect, it } from "vitest";
import { OG_HEIGHT, OG_WIDTH, traderCard } from "./og";

const card = {
  name: "Keen Lynx",
  since: "Trading here since Aug 2026",
  initials: "KL",
  hue: 120,
  stats: [
    { label: "Total P&L", value: "+$2,387.50", tone: "up" as const },
    { label: "Toward target", value: "80%" },
  ],
};

describe("traderCard", () => {
  it("should close a name with an ampersand in it rather than break the document", () => {
    // given a name carrying the characters that end an element
    const drawn = traderCard({ ...card, name: 'Fish & <Chips> "99"' });

    // when, then nothing raw reaches the markup
    expect(drawn).toContain("Fish &amp; &lt;Chips&gt;");
    expect(drawn).not.toContain("<Chips>");
  });

  it("should escape a label as well as a value", () => {
    // given the ampersand that every P&L label carries
    const drawn = traderCard(card);

    // when, then it is escaped where it is drawn
    expect(drawn).toContain("TOTAL P&amp;L");
    expect(drawn).not.toMatch(/>TOTAL P&L</);
  });

  it("should cut a name too long to fit rather than run it off the card", () => {
    // given a name far wider than the space
    const drawn = traderCard({ ...card, name: "a".repeat(60) });

    // when, then it is cut and marked as cut
    expect(drawn).toContain("…");
    expect(drawn).not.toContain("a".repeat(30));
  });

  it("should draw the card at the size a scraper expects", () => {
    // given, when, then
    expect(traderCard(card)).toContain(`width="${OG_WIDTH}" height="${OG_HEIGHT}"`);
    expect(OG_WIDTH / OG_HEIGHT).toBeCloseTo(1.91, 1);
  });

  it("should take at most four stats, so nothing is drawn off the edge", () => {
    // given more than the card has room for
    const many = Array.from({ length: 7 }, (_, i) => ({ label: `S${i}`, value: `${i}` }));
    const drawn = traderCard({ ...card, stats: many });

    // when, then the fifth onwards is dropped
    expect(drawn).toContain(">S3<");
    expect(drawn).not.toContain(">S4<");
  });

  it("should tint a loss and a gain apart", () => {
    // given one of each
    const drawn = traderCard({
      ...card,
      stats: [
        { label: "Up", value: "+1", tone: "up" },
        { label: "Down", value: "-1", tone: "down" },
      ],
    });

    // when, then they are not the same colour
    expect(drawn).toContain("#14b8a6");
    expect(drawn).toContain("#f43f5e");
  });
});

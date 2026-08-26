import { Resvg } from "@resvg/resvg-js";
import { personaOf } from "~/components/identity/persona";
import { formatPercent, formatSigned } from "~/lib/format";
import { OG_WIDTH, type Stat, traderCard } from "~/lib/og";
import { loadTrader } from "~/lib/trader.server";
import type { Route } from "./+types/trader-og";

/** A card is worth keeping: it only moves when the trader trades. */
const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export const loader = async ({ params }: Route.LoaderArgs) => {
  const trader = await loadTrader(params.id);

  if (!trader) {
    throw new Response("No such trader", { status: 404 });
  }

  const persona = personaOf(trader.id, trader.username);
  const pnl = trader.stats.pnlCents / 100;

  const stats: Stat[] = [
    { label: "Total P&L", value: formatSigned(pnl), tone: pnl < 0 ? "down" : "up" },
    {
      label: "Toward target",
      value: trader.targetShare === null ? "–" : formatPercent(trader.targetShare),
    },
    { label: "Passed", value: `${trader.counts.passed} of ${trader.counts.total}` },
    {
      label: "Win rate",
      value: trader.stats.winRate === null ? "–" : formatPercent(trader.stats.winRate),
    },
  ];

  const since =
    trader.stats.trades === 0
      ? "No trade closed yet"
      : `${trader.stats.trades} round trips · ${trader.stats.sessions} sessions`;

  const svg = traderCard({
    name: persona.name,
    since,
    initials: persona.initials,
    hue: persona.hue,
    stats,
  });

  // The renderer wants a raster: no scraper that matters draws an SVG.
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
    font: { loadSystemFonts: true },
  })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": CACHE },
  });
};

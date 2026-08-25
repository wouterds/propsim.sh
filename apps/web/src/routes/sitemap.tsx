import { href } from "react-router";
import { siteUrl } from "~/lib/site.server";

// The pages worth landing on. Everything behind a login is left out, and so is
// everything in the sign in flow: a crawler that follows one wastes its visit.
const PAGES = [
  href("/"),
  href("/plans"),
  href("/rules"),
  href("/red-folder-events"),
  href("/faq"),
  href("/feature-requests"),
  href("/contact"),
  href("/privacy"),
  href("/terms"),
];

export const loader = () => {
  const site = siteUrl();
  const urls = PAGES.map((path) => `  <url><loc>${site}${path}</loc></url>`).join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};

import { siteUrl } from "~/lib/site.server";

/** Everything public is crawlable. What is not public is behind a login anyway. */
export const loader = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl()}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

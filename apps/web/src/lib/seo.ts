/** The address the site is indexed under. Not the env var: meta runs in the browser too. */
export const SITE_URL = "https://propsim.sh";

const OG_IMAGE = `${SITE_URL}/og.png`;

type Page = {
  title: string;
  description: string;
  /** The path this page is canonical at, leading slash and no host. */
  path: string;
  /** A card of its own. Falls back to the site's when a page has nothing to say. */
  image?: string;
};

/**
 * Title, description, canonical and the cards, from one place. A page that sets
 * only half of them gets the site wide defaults from the root for the rest,
 * which is how a share ends up captioned with somebody else's page.
 */
export const pageMeta = ({ title, description, path, image }: Page) => {
  const url = `${SITE_URL}${path}`;
  const card = image ? `${SITE_URL}${image}` : OG_IMAGE;

  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: card },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "propsim.sh, a free prop trading simulator" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: card },
  ];
};

/**
 * For a page that exists to be used, not found: a sign in form or an account
 * behind it. Indexing them spends the crawl budget on doors.
 */
export const PRIVATE = [{ name: "robots", content: "noindex, nofollow" }];

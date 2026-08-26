import { redirect } from "react-router";
import Hero from "~/components/marketing/hero";
import PlanTable from "~/components/marketing/plan-table";
import Questions from "~/components/marketing/questions";
import Rules from "~/components/marketing/rules";
import { getUserId } from "~/lib/auth.server";
import { findArticle, HOME_SLUGS } from "~/lib/knowledge-base";
import { pageMeta, SITE_URL } from "~/lib/seo";
import type { Route } from "./+types/home";

export const loader = async ({ request }: Route.LoaderArgs) => {
  if (await getUserId(request)) {
    throw redirect("/dash");
  }

  return null;
};

const SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#site`,
      url: SITE_URL,
      name: "propsim.sh",
      description: "A free prop trading simulator.",
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "propsim.sh",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
    },
  ],
};

export const meta: Route.MetaFunction = () => [
  ...pageMeta({
    title: "propsim.sh, a free prop trading simulator",
    description:
      "A simulated futures account with a prop firm's rules on it. Live CME prices on a short delay, a daily loss limit and a trailing drawdown. Free, and no real money.",
    path: "/",
  }),
  { "script:ld+json": SCHEMA },
];

const Home = () => (
  <>
    <Hero />
    <PlanTable />
    <Rules />
    <Questions
      articles={HOME_SLUGS.flatMap((slug) => findArticle(slug) ?? [])}
      title="Common questions"
      more
    />
  </>
);

export default Home;

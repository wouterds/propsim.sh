import SiteFooter from "~/components/layout/site-footer";
import SiteHeader from "~/components/layout/site-header";
import CtaBand from "~/components/marketing/cta-band";
import FeatureGrid from "~/components/marketing/feature-grid";
import Hero from "~/components/marketing/hero";
import HowItWorks from "~/components/marketing/how-it-works";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "propsim.sh, a prop firm simulator that costs nothing" },
  {
    name: "description",
    content:
      "Trade a live MNQ session on a short delay against real prop firm rules. Daily loss limit, trailing drawdown, breaches. No eval fee and no card.",
  },
];

const Home = () => (
  <div className="flex min-h-dvh flex-col">
    <SiteHeader />
    <main className="flex-1">
      <Hero />
      <HowItWorks />
      <FeatureGrid />
      <CtaBand />
    </main>
    <SiteFooter />
  </div>
);

export default Home;

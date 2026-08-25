import SiteFooter from "~/components/layout/site-footer";
import SiteHeader from "~/components/layout/site-header";
import CtaBand from "~/components/marketing/cta-band";
import FeatureGrid from "~/components/marketing/feature-grid";
import Hero from "~/components/marketing/hero";
import HowItWorks from "~/components/marketing/how-it-works";
import ReplayCompare from "~/components/marketing/replay-compare";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "propsim.sh, trade the same session twice" },
  {
    name: "description",
    content:
      "A prop firm rule engine over a replayed futures session. Trade a real MNQ day, then trade it again, and compare the two runs.",
  },
];

const Home = () => (
  <div className="flex min-h-dvh flex-col">
    <SiteHeader />
    <main className="flex-1">
      <Hero />
      <HowItWorks />
      <FeatureGrid />
      <ReplayCompare />
      <CtaBand />
    </main>
    <SiteFooter />
  </div>
);

export default Home;

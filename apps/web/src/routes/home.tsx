import SiteFooter from "~/components/layout/site-footer";
import SiteHeader from "~/components/layout/site-header";
import Hero from "~/components/marketing/hero";
import Rules from "~/components/marketing/rules";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "propsim.sh, a free prop trading simulator" },
  {
    name: "description",
    content:
      "A simulated futures account with a prop firm's rules on it. Live MNQ prices on a short delay, a daily loss limit and a trailing drawdown. Free, and no real money.",
  },
];

const Home = () => (
  <div className="flex min-h-dvh flex-col">
    <SiteHeader />
    <main className="flex-1">
      <Hero />
      <Rules />
    </main>
    <SiteFooter />
  </div>
);

export default Home;

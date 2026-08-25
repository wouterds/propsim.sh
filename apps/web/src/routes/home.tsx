import { redirect } from "react-router";
import Hero from "~/components/marketing/hero";
import PlanTable from "~/components/marketing/plan-table";
import Questions from "~/components/marketing/questions";
import Rules from "~/components/marketing/rules";
import { getUserId } from "~/lib/auth.server";
import { HOME_QUESTIONS } from "~/lib/faq";
import { pageMeta } from "~/lib/seo";
import type { Route } from "./+types/home";

export const loader = async ({ request }: Route.LoaderArgs) => {
  if (await getUserId(request)) {
    throw redirect("/dash");
  }

  return null;
};

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: "propsim.sh, a free prop trading simulator",
    description:
      "A simulated futures account with a prop firm's rules on it. Live CME prices on a short delay, a daily loss limit and a trailing drawdown. Free, and no real money.",
    path: "/",
  });

const Home = () => (
  <>
    <Hero />
    <PlanTable />
    <Rules />
    <Questions questions={HOME_QUESTIONS} title="Common questions" more />
  </>
);

export default Home;

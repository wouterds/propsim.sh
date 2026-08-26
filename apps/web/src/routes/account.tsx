import AccountSummary from "~/components/account/account-summary";
import { planOf } from "~/lib/accounts";
import { loadAccount } from "~/lib/accounts.server";
import { requireUserId } from "~/lib/auth.server";
import { rulesOf } from "~/lib/rules";
import { PRIVATE } from "~/lib/seo";
import type { Route } from "./+types/account";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData ? `${loaderData.account.name}, propsim.sh` : "Account, propsim.sh" },
  ...PRIVATE,
];

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const loaded = await loadAccount(await requireUserId(request), params.id);

  if (!loaded) {
    throw new Response("No such account", { status: 404 });
  }

  return {
    account: loaded.account,
    plan: planOf(loaded.account),
    rules: rulesOf(loaded.account),
  };
};

const Account = ({ loaderData }: Route.ComponentProps) => <AccountSummary {...loaderData} />;

export default Account;

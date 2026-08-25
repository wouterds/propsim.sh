import { href, redirect } from "react-router";
import { loadAccounts } from "~/lib/accounts.server";
import { requireUserId } from "~/lib/auth.server";
import type { Route } from "./+types/terminal-redirect";

/** `/terminal` has no account of its own. It hands off to one that can trade. */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const accounts = await loadAccounts(await requireUserId(request));
  const account = accounts.find((open) => open.status === "live") ?? accounts[0];

  if (!account) {
    throw redirect(href("/accounts/new"));
  }

  throw redirect(href("/accounts/:id/terminal", { id: account.id }));
};

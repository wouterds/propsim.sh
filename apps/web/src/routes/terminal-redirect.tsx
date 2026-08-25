import { href, redirect } from "react-router";
import { ACCOUNTS, liveAccounts } from "~/lib/accounts";

/** `/terminal` has no account of its own. It hands off to one that can trade. */
export const loader = () => {
  const account = liveAccounts()[0] ?? ACCOUNTS[0];

  if (!account) {
    throw redirect(href("/dash"));
  }

  throw redirect(href("/accounts/:id/terminal", { id: account.id }));
};

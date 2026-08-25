import { Outlet } from "react-router";
import AppShell from "~/components/app/app-shell";
import { loadAccounts } from "~/lib/accounts.server";
import { endSession, requireUserId } from "~/lib/auth.server";
import { findUserById } from "~/lib/users.server";
import type { Route } from "./+types/app";

// Guards every page under it, so a new route inside this layout is protected by
// existing rather than by remembering.
export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await requireUserId(request);
  const user = await findUserById(userId);

  // The cookie only proves this server signed it. An account deleted since still
  // carries a valid one, so the row is what decides.
  if (!user) {
    throw await endSession(request);
  }

  return { accounts: await loadAccounts(userId), email: user.email };
};

const AppLayout = ({ loaderData }: Route.ComponentProps) => (
  <AppShell accounts={loaderData.accounts} email={loaderData.email}>
    <Outlet />
  </AppShell>
);

export default AppLayout;

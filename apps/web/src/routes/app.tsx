import { Outlet } from "react-router";
import AppShell from "~/components/app/app-shell";
import { ACCOUNTS } from "~/lib/accounts";
import { requireUserId } from "~/lib/auth.server";
import { findUserById } from "~/lib/users.server";
import type { Route } from "./+types/app";

// Guards every page under it, so a new route inside this layout is protected by
// existing rather than by remembering.
export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await requireUserId(request);
  const user = await findUserById(userId);

  return { accounts: ACCOUNTS, email: user?.email ?? "" };
};

const AppLayout = ({ loaderData }: Route.ComponentProps) => (
  <AppShell accounts={loaderData.accounts} email={loaderData.email}>
    <Outlet />
  </AppShell>
);

export default AppLayout;

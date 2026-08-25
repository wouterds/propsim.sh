import { Outlet } from "react-router";
import AppShell from "~/components/app/app-shell";
import { ACCOUNTS } from "~/lib/accounts";
import { endSession, requireUserId } from "~/lib/auth.server";
import { nextWindow } from "~/lib/blackout";
import { redFolderWindows } from "~/lib/news.server";
import { findUserById } from "~/lib/users.server";
import type { Route } from "./+types/app";

const DAY = 24 * 60 * 60 * 1000;

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

  const windows = await redFolderWindows();
  const next = nextWindow(windows, Date.now());
  const soon = next && next.at - Date.now() < DAY ? { at: next.at, titles: next.titles } : null;

  return { accounts: ACCOUNTS, email: user.email, upcoming: soon };
};

const AppLayout = ({ loaderData }: Route.ComponentProps) => (
  <AppShell accounts={loaderData.accounts} email={loaderData.email} upcoming={loaderData.upcoming}>
    <Outlet />
  </AppShell>
);

export default AppLayout;

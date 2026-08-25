import { Outlet } from "react-router";
import AppNav from "~/components/layout/app-nav";
import { requireUserId } from "~/lib/auth.server";
import type { Route } from "./+types/app";

// Guards every page under it, so a new route inside this layout is protected by
// existing rather than by remembering.
export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserId(request);

  return null;
};

const AppLayout = () => (
  <div className="flex h-dvh flex-col">
    <AppNav />
    <div className="min-h-0 flex-1 overflow-y-auto">
      <Outlet />
    </div>
  </div>
);

export default AppLayout;

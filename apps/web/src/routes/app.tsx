import { Outlet } from "react-router";
import AppNav from "~/components/layout/app-nav";

/**
 * A viewport-tall column, so the terminal below can claim what is left of the
 * screen with `h-full` instead of subtracting the nav's height from `100dvh`
 * and breaking the moment the nav changes size.
 */
const AppLayout = () => (
  <div className="flex h-dvh flex-col">
    <AppNav />
    <div className="min-h-0 flex-1 overflow-y-auto">
      <Outlet />
    </div>
  </div>
);

export default AppLayout;

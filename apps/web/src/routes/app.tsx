import { Outlet } from "react-router";
import AppNav from "~/components/layout/app-nav";

/** A viewport-tall column, so the terminal can claim the rest with `h-full`. */
const AppLayout = () => (
  <div className="flex h-dvh flex-col">
    <AppNav />
    <div className="min-h-0 flex-1 overflow-y-auto">
      <Outlet />
    </div>
  </div>
);

export default AppLayout;

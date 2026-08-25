import { Outlet } from "react-router";
import SiteFooter from "~/components/layout/site-footer";
import SiteHeader from "~/components/layout/site-header";

const SiteLayout = () => (
  <div className="flex min-h-dvh flex-col">
    <SiteHeader />
    <main className="flex-1">
      <Outlet />
    </main>
    <SiteFooter />
  </div>
);

export default SiteLayout;

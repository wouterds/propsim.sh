import { Outlet } from "react-router";
import SiteFooter from "~/components/layout/site-footer";
import SiteHeader from "~/components/layout/site-header";

const SiteLayout = () => (
  <div className="flex min-h-dvh flex-col">
    <SiteHeader />
    {/* Every section draws a bottom border, which on a page too short to fill
        the screen leaves a line hanging in the middle of it. The footer's own
        top border is what closes the page. */}
    <main className="flex-1 [&>*:last-child]:border-b-0">
      <Outlet />
    </main>
    <SiteFooter />
  </div>
);

export default SiteLayout;

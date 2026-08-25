import { Outlet } from "react-router";
import SiteFooter from "~/components/layout/site-footer";
import SiteHeader from "~/components/layout/site-header";
import { getUserId } from "~/lib/auth.server";
import type { Route } from "./+types/site";

// Nothing here is behind a login. It only decides whether the header offers a
// way in or a way back to the account.
export const loader = async ({ request }: Route.LoaderArgs) => ({
  signedIn: (await getUserId(request)) !== null,
});

const SiteLayout = ({ loaderData }: Route.ComponentProps) => (
  <div className="flex min-h-dvh flex-col">
    <SiteHeader signedIn={loaderData.signedIn} />
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

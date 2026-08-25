import "./tailwind.css";

import {
  href,
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import Brand from "~/components/layout/brand";
import GridBackdrop from "~/components/layout/grid-backdrop";
import PageLoader from "~/components/layout/page-loader";
import { PRIMARY_SM, SECONDARY_SM } from "~/components/ui/button";
import type { Route } from "./+types/root";

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      {/* No og:title here on purpose: crawlers fall back to the document title,
          which every route already sets to something better than a site-wide
          constant would be. */}
      <meta property="og:site_name" content="propsim.sh" />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en" />
      <meta name="twitter:card" content="summary_large_image" />
      <Meta />
      <Links />
    </head>
    <body className="min-h-full bg-base text-ink">{children}</body>
  </html>
);

const App = () => (
  <>
    <PageLoader />
    <Outlet />
    <ScrollRestoration />
    <Scripts />
  </>
);

const COPY: Record<number, { title: string; body: string }> = {
  404: {
    title: "Nothing here",
    body: "That address does not point at a page. It may have been renamed, or it may never have existed.",
  },
  500: {
    title: "That broke",
    body: "The page failed on the way out. Nothing you did caused it and nothing you were doing was lost.",
  },
};

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const copy = COPY[status] ?? COPY[500];

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-16">
      <GridBackdrop />

      <div className="relative w-full max-w-md text-center">
        <Link
          to={href("/")}
          className="mx-auto flex w-fit rounded-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          <Brand className="text-[1rem] text-ink" />
        </Link>

        <p className="mt-10 font-semibold text-[5rem] text-line-strong leading-none tabular tracking-tight">
          {status}
        </p>

        <h1 className="mt-4 font-semibold text-ink text-xl tracking-tight">{copy.title}</h1>
        <p className="mt-3 text-muted text-sm leading-relaxed">{copy.body}</p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to={href("/")} className={PRIMARY_SM}>
            Back to the site
          </Link>
          <Link to={href("/contact")} className={SECONDARY_SM}>
            Tell us
          </Link>
        </div>
      </div>

      <Scripts />
    </main>
  );
};

export default App;

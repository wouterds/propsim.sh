import "./tailwind.css";

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
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
      <meta name="twitter:card" content="summary" />
      <Meta />
      <Links />
    </head>
    <body className="min-h-full bg-base text-ink">{children}</body>
  </html>
);

const App = () => (
  <>
    <Outlet />
    <ScrollRestoration />
    <Scripts />
  </>
);

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  const isResponse = isRouteErrorResponse(error);
  const status = isResponse ? error.status : 500;
  const detail = isResponse && status === 404 ? "no such page" : "something broke";

  return (
    <main className="p-8 font-medium uppercase tracking-wider">
      <p className="text-down">{`${status} — ${detail}`}</p>
      {import.meta.env.DEV && error instanceof Error && error.stack && (
        <pre className="mt-4 overflow-x-auto text-faint text-xs normal-case">{error.stack}</pre>
      )}
      <Scripts />
    </main>
  );
};

export default App;

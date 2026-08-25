import { href, Link } from "react-router";
import Brand from "~/components/layout/brand";

const LINKS = [
  { to: href("/trading"), label: "Trading" },
  { to: href("/dash"), label: "Dashboard" },
  { to: href("/auth"), label: "Log in" },
];

const SiteFooter = () => (
  <footer className="border-line/70 border-t">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-8">
      <div>
        <Brand className="text-[15px] text-ink" />
        <p className="mt-3 max-w-xs text-faint text-sm leading-relaxed">
          A prop firm rule engine over a delayed live futures tape. No broker, no money, and no
          order ever leaves the browser.
        </p>
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-muted text-sm">
        {LINKS.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="rounded-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>

    <div className="border-line/70 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-faint text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Simulated fills against historical bars. Not a broker, not investment advice.</p>
        <p className="tabular">© 2026 propsim.sh</p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;

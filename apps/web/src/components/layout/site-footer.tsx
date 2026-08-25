import { href, Link } from "react-router";
import Brand from "~/components/layout/brand";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { to: href("/trading"), label: "Terminal" },
      { to: href("/dashboard"), label: "Dashboard" },
      { to: href("/auth"), label: "Log in" },
    ],
  },
  {
    title: "Instrument",
    links: [
      { to: href("/trading"), label: "MNQ, Micro Nasdaq 100" },
      { to: href("/trading"), label: "1m to 1h bars" },
      { to: href("/trading"), label: "CME session hours" },
    ],
  },
];

const SiteFooter = () => (
  <footer className="border-line/70 border-t">
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
      <div>
        <Brand className="text-[15px] text-ink" />
        <p className="mt-3 max-w-xs text-faint text-sm leading-relaxed">
          A prop firm rule engine over a delayed live futures tape. No broker, no money, and no
          order ever leaves the browser.
        </p>
      </div>

      {COLUMNS.map((column) => (
        <div key={column.title}>
          <p className="text-[11px] text-faint uppercase tracking-wider">{column.title}</p>
          <ul className="mt-3 space-y-2 text-muted text-sm">
            {column.links.map((link) => (
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
      ))}
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

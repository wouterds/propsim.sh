import { href, Link } from "react-router";
import Brand from "~/components/layout/brand";

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { to: href("/plans"), label: "Plans" },
      { to: href("/rules"), label: "Rules" },
      { to: href("/terminal"), label: "Terminal" },
    ],
  },
  {
    title: "Learn",
    links: [
      { to: href("/red-folder-events"), label: "Red folder" },
      { to: href("/faq"), label: "FAQ" },
      { to: href("/contact"), label: "Contact" },
    ],
  },
];

const SiteFooter = () => (
  <footer className="border-line/70 border-t">
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.5fr_repeat(2,1fr)]">
      <div>
        <Brand className="text-[15px] text-ink" />
        <p className="mt-3 max-w-sm text-faint text-sm leading-relaxed">
          A prop trading simulator. Live market data on a short delay, simulated fills, and no real
          money.
        </p>
      </div>

      {COLUMNS.map((column) => (
        <nav key={column.title} aria-label={column.title}>
          <p className="text-[11px] text-faint uppercase tracking-wider">{column.title}</p>
          <ul className="mt-3 space-y-2">
            {column.links.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className={`rounded-sm text-muted text-sm transition-colors hover:text-ink ${FOCUS}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>

    <div className="border-line/70 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-faint text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Simulated fills against delayed market data. Not a broker and not investment advice.</p>

        <div className="flex items-center gap-4">
          <Link
            to={href("/privacy")}
            className={`rounded-sm transition-colors hover:text-ink ${FOCUS}`}
          >
            Privacy
          </Link>
          <Link
            to={href("/terms")}
            className={`rounded-sm transition-colors hover:text-ink ${FOCUS}`}
          >
            Terms
          </Link>
          <p className="tabular">© 2026 propsim.sh</p>
        </div>
      </div>
    </div>
  </footer>
);

export default SiteFooter;

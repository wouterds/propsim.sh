import { href, Link } from "react-router";
import Brand from "~/components/layout/brand";
import { cn } from "~/lib/utils";

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { to: href("/plans"), label: "Plans" },
      { to: href("/terminal"), label: "Terminal" },
      { to: href("/leaderboards"), label: "Leaderboards" },
    ],
  },
  {
    title: "Learn",
    links: [
      { to: href("/red-folder-events"), label: "Red folder" },
      { to: href("/rules"), label: "Rules" },
    ],
  },
  {
    title: "Help",
    links: [
      { to: href("/knowledge-base"), label: "Knowledge base" },
      { to: href("/feature-requests"), label: "Feature requests" },
      { to: href("/contact"), label: "Contact" },
    ],
  },
];

// The link columns take the width of their own links and sit against the right
// edge. Equal fractions gave each one more room than it used, which left the
// last column stranded short of the edge.
const COLUMNS_GRID =
  "grid gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1fr_auto_auto_auto] lg:gap-x-16";

const BOTTOM =
  "flex flex-col gap-2 px-5 py-5 text-faint text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8";

/**
 * A band under the page has to line its content up with the page above it. The
 * panel is already that column, so inside one the same rail only insets it.
 */
const RAIL = "mx-auto w-full max-w-6xl";

/**
 * Boxed, it is a panel in the app's own content column rather than a band under
 * it, but only once there is a column to sit in. On a phone the panels above it
 * are the full width of the screen, so a second border around this one only
 * draws a box around a box. It runs full width there and carries no rule of its
 * own, since the panel above already ends in one, and takes a margin instead.
 */
const SiteFooter = ({ boxed = false }: { boxed?: boolean }) => (
  <footer
    className={
      boxed
        ? "mt-6 lg:mt-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-line lg:bg-raised"
        : "border-line/70 border-t"
    }
  >
    <div className={cn(COLUMNS_GRID, !boxed && RAIL)}>
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
      <div className={cn(BOTTOM, !boxed && RAIL)}>
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

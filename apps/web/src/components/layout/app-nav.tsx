import { href, Link, NavLink } from "react-router";
import Brand from "~/components/layout/brand";
import { ACCOUNT } from "~/lib/account";
import { formatMoney } from "~/lib/format";
import { cn } from "~/lib/utils";

const LINKS = [
  { to: href("/dash"), label: "Dashboard" },
  { to: href("/trading"), label: "Trading" },
];

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

// The nav is the scroll container rather than the page: at 360px the four
// controls do not fit, and left alone they push the whole document sideways.
const AppNav = () => (
  <header className="flex h-14 shrink-0 items-center gap-3 overflow-x-auto border-line border-b bg-raised px-3 sm:gap-4 sm:px-4">
    <Link to={href("/")} className={cn("shrink-0 rounded-sm", FOCUS)}>
      <Brand className="text-[15px] text-ink" />
    </Link>

    <nav className="flex shrink-0 items-center gap-1">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            cn(
              "inline-flex h-8 items-center whitespace-nowrap rounded px-2.5 text-sm transition-colors sm:px-3",
              FOCUS,
              isActive ? "bg-accent/15 text-accent" : "text-muted hover:text-ink",
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>

    <div className="ml-auto flex shrink-0 items-center gap-3 pl-1">
      <div className="hidden flex-col items-end leading-tight sm:flex">
        <span className="text-[10px] text-faint uppercase tracking-wider">{ACCOUNT.id}</span>
        <span className="text-ink text-xs tabular">{formatMoney(ACCOUNT.balance)}</span>
      </div>

      {/* No session to end, so this drops back to the landing page rather than
          pretending a sign-out round trip happened. */}
      <Link
        to={href("/")}
        className={cn(
          "inline-flex h-8 items-center whitespace-nowrap rounded border border-line px-2.5 text-muted text-sm transition-colors hover:text-ink sm:px-3",
          FOCUS,
        )}
      >
        Log out
      </Link>
    </div>
  </header>
);

export default AppNav;

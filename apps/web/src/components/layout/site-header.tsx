import { href, Link, NavLink } from "react-router";
import Brand from "~/components/layout/brand";
import { cn } from "~/lib/utils";

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const LINKS = [
  { to: href("/plans"), label: "Plans" },
  { to: href("/rules"), label: "Rules" },
  { to: href("/faq"), label: "FAQ" },
];

const SiteHeader = () => (
  <header className="sticky top-0 z-30 border-line/70 border-b bg-base/80 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
      <Link to={href("/")} className={cn("shrink-0 rounded-sm", FOCUS)}>
        <Brand className="text-[15px] text-ink" />
      </Link>

      <nav className="-mx-2 hidden items-center gap-1 sm:flex">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "inline-flex h-8 items-center rounded px-2 text-sm transition-colors",
                FOCUS,
                isActive ? "text-ink" : "text-muted hover:text-ink",
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <Link
          to={href("/auth")}
          className={cn("rounded-sm text-muted text-sm transition-colors hover:text-ink", FOCUS)}
        >
          Log in
        </Link>

        <Link
          to={href("/terminal")}
          className={cn(
            "inline-flex h-8 items-center rounded bg-accent px-3 font-medium text-sunken text-sm transition-colors hover:bg-accent/85",
            FOCUS,
          )}
        >
          Start trading
        </Link>
      </div>
    </div>
  </header>
);

export default SiteHeader;

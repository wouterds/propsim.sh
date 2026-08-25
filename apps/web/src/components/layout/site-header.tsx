import { href, Link, NavLink } from "react-router";
import Brand from "~/components/layout/brand";
import { cn } from "~/lib/utils";

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const LINKS = [
  { to: href("/plans"), label: "Plans" },
  { to: href("/rules"), label: "Rules" },
  { to: href("/faq"), label: "FAQ" },
];

const SiteHeader = ({ signedIn }: { signedIn: boolean }) => (
  <header className="sticky top-0 z-30 border-line/70 border-b bg-base/80 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5 sm:gap-6 sm:px-8">
      <Link to={href("/")} className={cn("shrink-0 rounded-sm", FOCUS)}>
        <Brand className="text-[15px] text-ink" />
      </Link>

      <nav className="-mx-2 flex items-center gap-1">
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
          to={signedIn ? href("/dash") : href("/terminal")}
          className={cn(
            "h-8 items-center rounded bg-accent-strong px-3 font-medium text-ink text-sm transition-colors hover:bg-accent-strong/85",
            "inline-flex",
            FOCUS,
          )}
        >
          {signedIn ? "Dashboard" : "Start trading"}
        </Link>
      </div>
    </div>
  </header>
);

export default SiteHeader;

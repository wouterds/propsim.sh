import { href, Link } from "react-router";
import Brand from "~/components/layout/brand";

const SECTIONS = [
  { href: "#how", label: "How it works" },
  { href: "#engine", label: "The engine" },
  { href: "#replay", label: "Replay" },
];

const SiteHeader = () => (
  <header className="sticky top-0 z-30 border-line/70 border-b bg-base/80 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
      <Link
        to={href("/")}
        className="rounded-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
      >
        <Brand className="text-[15px] text-ink" />
      </Link>

      <nav className="hidden flex-1 items-center gap-6 text-muted text-sm md:flex">
        {SECTIONS.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="rounded-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <Link
          to={href("/login")}
          className="hidden h-8 items-center rounded px-3 text-muted text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent sm:inline-flex"
        >
          Log in
        </Link>
        <Link
          to={href("/trading")}
          className="inline-flex h-8 items-center rounded bg-accent px-3 font-medium text-sunken text-sm transition-colors hover:bg-accent/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          Open the simulator
        </Link>
      </div>
    </div>
  </header>
);

export default SiteHeader;

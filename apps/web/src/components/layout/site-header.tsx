import { href, Link } from "react-router";
import Brand from "~/components/layout/brand";

const SiteHeader = () => (
  <header className="sticky top-0 z-30 border-line/70 border-b bg-base/80 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
      <Link
        to={href("/")}
        className="rounded-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
      >
        <Brand className="text-[15px] text-ink" />
      </Link>

      <div className="ml-auto flex items-center">
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

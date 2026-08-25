import { href, Link } from "react-router";
import { cn } from "~/lib/utils";
import type { AuthMode } from "./mode";

const TAB =
  "flex-1 rounded py-1.5 text-center text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

type Props = {
  mode: AuthMode;
};

const ModeTabs = ({ mode }: Props) => (
  <div className="mb-6 flex gap-1 rounded-lg border border-line bg-sunken p-1">
    <Link
      to={href("/auth")}
      className={cn(
        TAB,
        mode === "login" ? "bg-accent font-medium text-sunken" : "text-muted hover:text-ink",
      )}
    >
      Log in
    </Link>
    <Link
      to={`${href("/auth")}?mode=signup`}
      className={cn(
        TAB,
        mode === "signup" ? "bg-accent font-medium text-sunken" : "text-muted hover:text-ink",
      )}
    >
      Create account
    </Link>
  </div>
);

export default ModeTabs;

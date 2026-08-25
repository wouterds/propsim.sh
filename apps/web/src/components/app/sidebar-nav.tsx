import { Plus } from "lucide-react";
import { Form, href, Link, NavLink } from "react-router";
import NavIcon, { type NavIconName } from "~/components/app/nav-icon";
import Brand from "~/components/layout/brand";
import { type Account, netPnlOf, STATUS_LABEL, STATUS_TONE } from "~/lib/accounts";
import { formatMoney, formatSigned, TONE_TEXT, toneOf } from "~/lib/format";
import { cn } from "~/lib/utils";

type Props = {
  accounts: Account[];
  email: string;
  onNavigate?: () => void;
};

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const ITEM = "flex h-8 items-center gap-2 rounded px-2.5 text-sm transition-colors";

// One hover for every row. Plainly there, and plainly weaker than the tint an
// active row carries.
const HOVER = "hover:bg-overlay hover:text-ink";

// Grey, and a step past the hover rather than a colour: the row you are on is
// the one that is lit, not the one that is blue.
const ACTIVE = "bg-line text-ink";

const DOT: Record<string, string> = {
  up: "bg-up",
  down: "bg-down",
  accent: "bg-accent",
};

const LINKS: { to: string; label: string; icon: NavIconName }[] = [
  { to: href("/dash"), label: "Overview", icon: "overview" },
  { to: href("/accounts"), label: "Accounts", icon: "accounts" },
];

const SidebarNav = ({ accounts, email, onNavigate }: Props) => (
  <div className="flex h-full min-h-0 flex-col">
    <div className="flex h-14 shrink-0 items-center px-4">
      <Link to={href("/")} className={cn("rounded-sm", FOCUS)} onClick={onNavigate}>
        <Brand className="text-[15px] text-ink" />
      </Link>
    </div>

    <nav className="shrink-0 space-y-1 px-3">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className={({ isActive }) => cn(ITEM, FOCUS, isActive ? ACTIVE : cn("text-muted", HOVER))}
        >
          <NavIcon name={link.icon} />
          {link.label}
        </NavLink>
      ))}
    </nav>

    <p className="mt-6 shrink-0 px-4 text-[11px] text-faint uppercase tracking-wider">
      Your accounts
    </p>

    <div className="mt-1 min-h-0 flex-1 overflow-y-auto px-3">
      <ul className="space-y-1">
        {accounts.map((account) => {
          const netPnl = netPnlOf(account);

          return (
            <li key={account.id}>
              <NavLink
                to={href("/accounts/:id", { id: account.id })}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded px-2.5 py-2 transition-colors",
                    FOCUS,
                    isActive ? "bg-line" : HOVER,
                  )
                }
              >
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", DOT[STATUS_TONE[account.status]])}
                  aria-hidden="true"
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ink text-sm">{account.name}</span>
                  <span className="block text-[11px] text-faint tabular">
                    {account.status === "live"
                      ? formatMoney(account.balance)
                      : `${STATUS_LABEL[account.status]} · ${formatMoney(account.balance)}`}
                  </span>
                </span>

                <span className={cn("shrink-0 text-[11px] tabular", TONE_TEXT[toneOf(netPnl)])}>
                  {formatSigned(netPnl)}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      <Link
        to={href("/accounts/new")}
        onClick={onNavigate}
        className={cn(
          "mt-2 flex h-9 items-center justify-center gap-1.5 rounded border border-line border-dashed text-muted text-sm transition-colors hover:border-line-strong",
          HOVER,
          FOCUS,
        )}
      >
        <Plus aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
        New account
      </Link>
    </div>

    <div className="shrink-0 border-line border-t p-3">
      <NavLink
        to={href("/settings")}
        onClick={onNavigate}
        title={email}
        className={({ isActive }) => cn(ITEM, FOCUS, isActive ? ACTIVE : cn("text-muted", HOVER))}
      >
        <NavIcon name="user" />
        <span className="truncate">{email}</span>
      </NavLink>

      <Form method="post" action={href("/logout")} className="mt-1">
        <button type="submit" className={cn(ITEM, FOCUS, "w-full text-muted", HOVER)}>
          <NavIcon name="logout" />
          Log out
        </button>
      </Form>
    </div>
  </div>
);

export default SidebarNav;

import { href, NavLink } from "react-router";
import Badge from "~/components/ui/badge";
import { type Account, type Ending, planOf, STATUS_LABEL, STATUS_TONE } from "~/lib/accounts";
import { formatDate, formatMoment } from "~/lib/format";
import { cn } from "~/lib/utils";

type Props = {
  account: Account;
};

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

/** Named for the rule, because "breached" alone sends people looking for which. */
const ENDING: Record<Ending, string> = {
  trailing_drawdown: "Closed by the trailing drawdown",
  daily_loss: "Closed by the daily loss limit",
  news: "Closed by a red folder release",
  target_met: "Passed on the profit target",
};

const AccountHeader = ({ account }: Props) => {
  const plan = planOf(account);

  // Only the summary matches exactly. The others stay lit on a page under them,
  // so opening one session does not read as having left the journal.
  const tabs = [
    { to: href("/accounts/:id", { id: account.id }), label: "Summary", end: true },
    { to: href("/accounts/:id/journal", { id: account.id }), label: "Journal", end: false },
    { to: href("/accounts/:id/terminal", { id: account.id }), label: "Terminal", end: false },
  ];

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-semibold text-ink text-xl tracking-tight">{account.name}</h1>
          <Badge tone={STATUS_TONE[account.status]} dot>
            {STATUS_LABEL[account.status]}
          </Badge>
        </div>

        <p className="mt-1 text-faint text-xs tabular">
          {plan.label} · up to {plan.maxMicros} micros · opened {formatDate(account.openedOn)}
        </p>

        {/* No box around it. The badge above has already said something is
            wrong, and this is the sentence that says what. */}
        {account.endedReason && account.endedAt && (
          <p
            className={cn(
              "mt-2 text-sm",
              account.endedReason === "target_met" ? "text-accent" : "text-down",
            )}
          >
            {ENDING[account.endedReason]}
            <span className="text-faint"> · {formatMoment(new Date(account.endedAt))}</span>
          </p>
        )}

        <nav className="-mx-2.5 mt-4 flex items-center gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "inline-flex h-8 items-center rounded px-2.5 text-sm transition-colors",
                  FOCUS,
                  isActive ? "bg-line text-ink" : "text-muted hover:text-ink",
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AccountHeader;

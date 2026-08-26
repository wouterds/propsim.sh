import { href, NavLink } from "react-router";
import Badge from "~/components/ui/badge";
import { type Account, ENDING, planOf, STATUS_LABEL, STATUS_TONE } from "~/lib/accounts";
import { formatDate, formatMoment } from "~/lib/format";
import { cn } from "~/lib/utils";

type Props = {
  account: Account;
};

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const AccountHeader = ({ account }: Props) => {
  const plan = planOf(account);

  // Only the summary matches exactly. The others stay lit on a page under them,
  // so opening one session does not read as having left the journal.
  //
  // An account that has ended takes no more orders, so the terminal goes with
  // it rather than sitting there as a door that turns you round.
  const tabs = [
    { to: href("/accounts/:id", { id: account.id }), label: "Summary", end: true },
    { to: href("/accounts/:id/journal", { id: account.id }), label: "Journal", end: false },
    ...(account.endedAt
      ? []
      : [
          { to: href("/accounts/:id/terminal", { id: account.id }), label: "Terminal", end: false },
        ]),
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

        {/* One line for what the account is. The badge has already said that
            something ended it, and this is where it says what and when. */}
        <p className="mt-1 text-faint text-xs tabular">
          {plan.label} · up to {plan.maxMicros} micros · opened {formatDate(account.openedOn)}
          {account.endedReason && account.endedAt && (
            <>
              {" · "}
              <span className={account.endedReason === "target_met" ? "text-accent" : "text-down"}>
                {ENDING[account.endedReason]}
              </span>
              {" · "}
              {formatMoment(new Date(account.endedAt))}
            </>
          )}
        </p>

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

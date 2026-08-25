import { href, Link } from "react-router";
import Badge from "~/components/ui/badge";
import { type Account, netPnlOf, STATUS_LABEL, STATUS_TONE } from "~/lib/accounts";
import { formatMoney, formatSigned, TONE_TEXT, toneOf } from "~/lib/format";
import { cn } from "~/lib/utils";

type Props = {
  accounts: Account[];
};

const AccountRail = ({ accounts }: Props) => (
  <div className="rounded-lg border border-line bg-raised">
    <div className="flex h-9 items-center border-line border-b px-4">
      <span className="text-[11px] text-faint uppercase tracking-wider">Accounts</span>
    </div>

    <ul className="divide-y divide-line/60">
      {accounts.map((account) => {
        const netPnl = netPnlOf(account);

        return (
          <li key={account.id}>
            <Link
              to={href("/accounts/:id", { id: account.id })}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-overlay focus-visible:outline-hidden focus-visible:bg-overlay"
            >
              <div className="min-w-0">
                <p className="truncate text-ink text-sm">{account.name}</p>
                <p className="mt-0.5 text-faint text-xs tabular">{formatMoney(account.balance)}</p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={cn("text-xs tabular", TONE_TEXT[toneOf(netPnl)])}>
                  {formatSigned(netPnl)}
                </span>
                <Badge tone={STATUS_TONE[account.status]}>{STATUS_LABEL[account.status]}</Badge>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  </div>
);

export default AccountRail;

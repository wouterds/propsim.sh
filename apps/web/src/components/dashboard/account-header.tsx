import { href, Link } from "react-router";
import Badge from "~/components/dashboard/badge";
import type { Account } from "~/lib/account";

type Props = {
  account: Account;
};

const AccountHeader = ({ account }: Props) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <div className="flex items-center gap-2">
        <h1 className="font-semibold text-ink text-xl tracking-tight">{account.name}</h1>
        <Badge tone="accent">{account.phase}</Badge>
      </div>
      <p className="mt-1 text-faint text-xs tabular">
        {account.id} · MNQ · {account.daysTraded} sessions traded
      </p>
    </div>

    <Link
      to={href("/trading")}
      className="inline-flex h-9 items-center rounded bg-accent px-4 font-medium text-sm text-sunken transition-colors hover:bg-accent/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
    >
      Start trading
    </Link>
  </div>
);

export default AccountHeader;

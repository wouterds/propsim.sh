import { Meter } from "@base-ui/react/meter";
import { href, Link } from "react-router";
import Badge from "~/components/ui/badge";
import {
  type Account,
  dailyFloorOf,
  floorToneOf,
  isOpen,
  netPnlOf,
  planOf,
  roomLeftOf,
  STATUS_LABEL,
  STATUS_TONE,
  targetOf,
  trailingFloorOf,
} from "~/lib/accounts";
import { FLOOR_BAR, FLOOR_TEXT, formatMoney, formatSigned, TONE_TEXT, toneOf } from "~/lib/format";
import { cn } from "~/lib/utils";

type Props = {
  account: Account;
};

const AccountCard = ({ account }: Props) => {
  const plan = planOf(account);
  const netPnl = netPnlOf(account);
  const progress = Math.min(1, Math.max(0, netPnl / plan.profitTarget));

  const floors = [
    {
      label: "Daily",
      room: account.balance - dailyFloorOf(account),
      left: roomLeftOf(account.balance, dailyFloorOf(account), plan.dailyLossLimit),
    },
    {
      label: "Trailing",
      room: account.balance - trailingFloorOf(account),
      left: roomLeftOf(account.balance, trailingFloorOf(account), plan.trailingDrawdown),
    },
  ];

  return (
    <div className="flex flex-col rounded-lg border border-line bg-raised">
      <div className="flex items-start justify-between gap-3 border-line/70 border-b px-4 py-3">
        <div className="min-w-0">
          <Link
            to={href("/accounts/:id", { id: account.id })}
            className="rounded-sm font-medium text-ink transition-colors hover:text-accent focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          >
            {account.name}
          </Link>
          <p className="mt-0.5 text-faint text-xs tabular">
            {formatMoney(account.balance)} of {formatMoney(plan.size)}
          </p>
        </div>
        <Badge tone={STATUS_TONE[account.status]} dot>
          {STATUS_LABEL[account.status]}
        </Badge>
      </div>

      <div className="px-4 py-4">
        <Meter.Root value={progress} min={0} max={1}>
          <div className="flex items-baseline justify-between">
            <Meter.Label className="text-[11px] text-faint uppercase tracking-wider">
              To the target
            </Meter.Label>
            <span className={cn("text-sm tabular", TONE_TEXT[toneOf(netPnl)])}>
              {formatSigned(netPnl)}
            </span>
          </div>

          <Meter.Track className="mt-2 block h-1.5 overflow-hidden rounded-full bg-sunken">
            <Meter.Indicator className="h-full rounded-full bg-up" />
          </Meter.Track>

          <p className="mt-1.5 text-[11px] text-faint tabular">
            Target {formatMoney(targetOf(account))}
          </p>
        </Meter.Root>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-line/70 border-t pt-3">
          {floors.map((floor) => (
            <div key={floor.label}>
              <dt className="text-[11px] text-faint uppercase tracking-wider">
                {floor.label} room
              </dt>
              <dd className={cn("mt-0.5 text-sm tabular", FLOOR_TEXT[floorToneOf(floor.left)])}>
                {formatMoney(floor.room)}
              </dd>
              <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-sunken">
                <div
                  className={cn("h-full rounded-full", FLOOR_BAR[floorToneOf(floor.left)])}
                  style={{ width: `${floor.left * 100}%` }}
                />
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-auto flex gap-2 border-line/70 border-t px-4 py-3">
        <Link
          to={href("/accounts/:id", { id: account.id })}
          className="inline-flex h-8 items-center rounded border border-line px-3 text-muted text-xs transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          Summary
        </Link>
        <Link
          to={href("/accounts/:id/journal", { id: account.id })}
          className="inline-flex h-8 items-center rounded border border-line px-3 text-muted text-xs transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          Journal
        </Link>
        {isOpen(account.status) && (
          <Link
            to={href("/accounts/:id/terminal", { id: account.id })}
            className="ml-auto inline-flex h-8 items-center rounded bg-accent-strong px-3 font-medium text-ink text-xs transition-colors hover:bg-accent-strong/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          >
            Terminal
          </Link>
        )}
      </div>
    </div>
  );
};

export default AccountCard;

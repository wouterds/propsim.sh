import Badge from "~/components/dashboard/badge";
import { floorToneOf, roomLeftOf } from "~/lib/account";
import { FLOOR_BAR, FLOOR_TEXT, formatMoney, formatPercent } from "~/lib/format";
import { cn } from "~/lib/utils";

type Props = {
  label: string;
  equity: number;
  floor: number;
  limit: number;
  detail: string;
};

const FloorMeter = ({ label, equity, floor, limit, detail }: Props) => {
  const room = equity - floor;
  const left = roomLeftOf(equity, floor, limit);
  const tone = floorToneOf(left);

  return (
    <div className="rounded-lg border border-line bg-raised">
      <div className="flex h-9 items-center justify-between border-line border-b px-4">
        <span className="text-[11px] text-faint uppercase tracking-wider">{label}</span>
        <Badge tone={tone}>{formatPercent(left)} left</Badge>
      </div>

      <div className="p-4">
        <p className={cn("font-semibold text-2xl tabular", FLOOR_TEXT[tone])}>
          {formatMoney(room)}
        </p>
        <p className="mt-1 text-faint text-xs">of {formatMoney(limit)} before the account is cut</p>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sunken">
          <div
            className={cn("h-full rounded-full transition-[width]", FLOOR_BAR[tone])}
            style={{ width: `${left * 100}%` }}
          />
        </div>

        <dl className="mt-4 flex justify-between border-line/70 border-t pt-3 text-xs">
          <div>
            <dt className="text-faint">Floor</dt>
            <dd className="mt-0.5 text-ink tabular">{formatMoney(floor)}</dd>
          </div>
          <div className="text-right">
            <dt className="text-faint">Equity</dt>
            <dd className="mt-0.5 text-ink tabular">{formatMoney(equity)}</dd>
          </div>
        </dl>

        <p className="mt-3 text-muted text-xs leading-relaxed">{detail}</p>
      </div>
    </div>
  );
};

export default FloorMeter;

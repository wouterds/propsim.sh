import { Meter } from "@base-ui/react/meter";
import Badge from "~/components/ui/badge";
import { floorToneOf, roomLeftOf } from "~/lib/accounts";
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
      <Meter.Root value={left} min={0} max={1}>
        <div className="flex h-9 items-center justify-between border-line border-b px-4">
          <Meter.Label className="text-[11px] text-faint uppercase tracking-wider">
            {label}
          </Meter.Label>
          <Badge tone={tone}>{formatPercent(left)} left</Badge>
        </div>

        <div className="p-4">
          <p className={cn("font-semibold text-2xl tabular", FLOOR_TEXT[tone])}>
            {formatMoney(room)}
          </p>
          <p className="mt-1 text-faint text-xs">
            of room, against a limit of {formatMoney(limit)}
          </p>

          <Meter.Track className="mt-4 block h-1.5 overflow-hidden rounded-full bg-sunken">
            <Meter.Indicator
              className={cn("h-full rounded-full transition-[width]", FLOOR_BAR[tone])}
            />
          </Meter.Track>

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
      </Meter.Root>
    </div>
  );
};

export default FloorMeter;

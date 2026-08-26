import { Meter } from "@base-ui/react/meter";
import type { ReactNode } from "react";
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
  /** The pair of readings under the bar, beyond the floor and the equity. */
  extra?: { term: string; value: ReactNode };
  /** False once the account is finished, when the room left is a fact and not a budget. */
  live?: boolean;
};

const FloorMeter = ({ label, equity, floor, limit, detail, extra, live = true }: Props) => {
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
          {/* A finished account has no room left to spend, whatever the last
              reading was, so it is told what it ended on instead of a budget. */}
          <Badge tone={live ? tone : "muted"}>
            {live ? `${formatPercent(left)} left` : "Final"}
          </Badge>
        </div>

        <div className="p-4">
          <p
            className={cn("font-semibold text-2xl tabular", live ? FLOOR_TEXT[tone] : "text-muted")}
          >
            {formatMoney(room)}
          </p>
          <p className="mt-1 text-faint text-xs">
            {live ? "of room, against a limit of" : "of room when it closed, against"}{" "}
            {formatMoney(limit)}
          </p>

          <Meter.Track className="mt-4 block h-1.5 overflow-hidden rounded-full bg-sunken">
            <Meter.Indicator
              className={cn(
                "h-full rounded-full transition-[width]",
                live ? FLOOR_BAR[tone] : "bg-line-strong",
              )}
            />
          </Meter.Track>

          <dl className="mt-4 grid grid-cols-2 gap-y-3 border-line/70 border-t pt-3 text-xs">
            <div>
              <dt className="text-faint">Floor</dt>
              <dd className="mt-0.5 text-ink tabular">{formatMoney(floor)}</dd>
            </div>
            <div className="text-right">
              <dt className="text-faint">Equity</dt>
              <dd className="mt-0.5 text-ink tabular">{formatMoney(equity)}</dd>
            </div>

            {extra && (
              <div className="col-span-2 border-line/70 border-t pt-3">
                <dt className="text-faint">{extra.term}</dt>
                <dd className="mt-0.5 text-ink tabular">{extra.value}</dd>
              </div>
            )}
          </dl>

          <p className="mt-3 text-muted text-xs leading-relaxed">{detail}</p>
        </div>
      </Meter.Root>
    </div>
  );
};

export default FloorMeter;

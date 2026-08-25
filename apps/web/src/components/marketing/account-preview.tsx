import CandleStrip from "~/components/marketing/candle-strip";
import { ACCOUNT, dailyFloorOf, floorToneOf, roomLeftOf, trailingFloorOf } from "~/lib/account";
import { FLOOR_BAR, FLOOR_TEXT, formatMoney, formatSigned, TONE_TEXT, toneOf } from "~/lib/format";
import { cn } from "~/lib/utils";

const floorFrom = (label: string, floor: number, limit: number) => {
  const room = ACCOUNT.balance - floor;
  const left = roomLeftOf(ACCOUNT.balance, floor, limit);

  return { label, floor, room, left, tone: floorToneOf(left) };
};

const FLOORS = [
  floorFrom("Daily floor", dailyFloorOf(ACCOUNT), ACCOUNT.dailyLossLimit),
  floorFrom("Trailing floor", trailingFloorOf(ACCOUNT), ACCOUNT.trailingDrawdown),
];

const DAY_PNL = ACCOUNT.balance - ACCOUNT.sessionOpenEquity;

const AccountPreview = () => (
  <div className="overflow-hidden rounded-xl border border-line bg-raised shadow-[0_24px_80px_-40px_rgb(0_0_0)]">
    <div className="flex h-9 items-center justify-between border-line border-b px-3 text-[11px] uppercase tracking-wider">
      <span className="text-muted">{ACCOUNT.id}</span>
      <span className="flex items-center gap-1.5 text-faint">
        <span className="size-1.5 rounded-full bg-accent" />
        Live, delayed
      </span>
    </div>

    <div className="border-line/70 border-b bg-sunken/40 px-3 pt-4 pb-2">
      <CandleStrip />
    </div>

    <dl className="grid grid-cols-2 divide-x divide-line/70 border-line/70 border-b">
      <div className="px-3 py-3">
        <dt className="text-[11px] text-faint uppercase tracking-wider">Equity</dt>
        <dd className="mt-1 font-medium text-ink text-lg tabular">
          {formatMoney(ACCOUNT.balance)}
        </dd>
      </div>
      <div className="px-3 py-3">
        <dt className="text-[11px] text-faint uppercase tracking-wider">Day P&amp;L</dt>
        <dd className={cn("mt-1 font-medium text-lg tabular", TONE_TEXT[toneOf(DAY_PNL)])}>
          {formatSigned(DAY_PNL)}
        </dd>
      </div>
    </dl>

    <div className="space-y-3 px-3 py-3">
      {FLOORS.map((floor) => (
        <div key={floor.label}>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted">{floor.label}</span>
            <span className="text-faint tabular">{formatMoney(floor.floor)}</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sunken">
            <div
              className={cn("h-full rounded-full", FLOOR_BAR[floor.tone])}
              style={{ width: `${floor.left * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-faint">
            <span className={cn("tabular", FLOOR_TEXT[floor.tone])}>{formatMoney(floor.room)}</span>{" "}
            of room left
          </p>
        </div>
      ))}
    </div>

    <div className="flex items-center justify-between border-line/70 border-t bg-sunken/40 px-3 py-2.5 text-[11px]">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-up/10 px-2 py-0.5 font-medium text-up uppercase tracking-wider">
        <span className="size-1.5 rounded-full bg-up" />
        Within rules
      </span>
      <span className="text-faint tabular">
        {`${ACCOUNT.daysTraded} of ${ACCOUNT.minimumDays} days traded`}
      </span>
    </div>
  </div>
);

export default AccountPreview;

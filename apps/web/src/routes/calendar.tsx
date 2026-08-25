import { getNewsEvents, isRedFolder } from "@propsim/datasources";
import Badge from "~/components/ui/badge";
import { AFTER_MINUTES, BEFORE_MINUTES } from "~/lib/blackout";
import { formatDay, formatRelative } from "~/lib/format";
import type { Route } from "./+types/calendar";

export const meta: Route.MetaFunction = () => [
  { title: "Calendar, propsim.sh" },
  {
    name: "description",
    content:
      "Every high impact US release, and the window either side of it where a daily payout account has to be flat.",
  },
];

const CLOCK = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  hour12: false,
});

export const loader = async () => {
  const now = new Date();
  const events = (await getNewsEvents()).filter(isRedFolder);

  const rows = events.map((event) => {
    const at = new Date(event.time);

    return {
      id: event.id,
      title: event.title,
      day: formatDay(at.toISOString().slice(0, 10)),
      time: `${CLOCK.format(at)} UTC`,
      when: formatRelative(at, now),
      past: event.time < now.getTime(),
    };
  });

  return {
    upcoming: rows.filter((row) => !row.past),
    past: rows.filter((row) => row.past).reverse(),
  };
};

type Row = Awaited<ReturnType<typeof loader>>["upcoming"][number];

const Table = ({ rows, title, empty }: { rows: Row[]; title: string; empty: string }) => (
  <div className="min-w-0 rounded-lg border border-line bg-raised">
    <div className="flex h-9 items-center border-line border-b px-4">
      <span className="text-[11px] text-faint uppercase tracking-wider">{title}</span>
    </div>

    {rows.length === 0 ? (
      <p className="px-4 py-8 text-center text-faint text-sm">{empty}</p>
    ) : (
      <ul className="divide-y divide-line/60">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
            <span className="w-28 shrink-0 text-ink text-xs tabular">{row.day}</span>
            <span className="w-20 shrink-0 text-muted text-xs tabular">{row.time}</span>
            <span className="min-w-0 flex-1 text-ink text-sm">{row.title}</span>
            <span className="shrink-0 text-faint text-xs">{row.when}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const Calendar = ({ loaderData }: Route.ComponentProps) => (
  <section className="border-line/70 border-b">
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-semibold text-4xl text-ink leading-[1.1] tracking-tight">Calendar</h1>
          <p className="mt-6 text-muted leading-relaxed">
            Every high impact US release on this week's calendar. You have to be flat from{" "}
            {BEFORE_MINUTES} minute before one through {AFTER_MINUTES} minute after it, and on a
            daily payout account being caught inside that window ends the account.
          </p>
        </div>
        <Badge tone="down" dot>
          Red folder
        </Badge>
      </div>

      <div className="mt-10 grid gap-3">
        <Table
          rows={loaderData.upcoming}
          title="Coming up"
          empty="Nothing high impact left on this week's calendar."
        />
        <Table
          rows={loaderData.past}
          title="Already out"
          empty="Nothing high impact has landed yet this week."
        />
      </div>

      <p className="mt-6 text-faint text-xs">
        Times are UTC. The calendar covers the current week and is read again every quarter hour.
      </p>
    </div>
  </section>
);

export default Calendar;

import { href, Link } from "react-router";

type Props = {
  at: number;
  titles: string[];
};

const UTC = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * UTC, so it reads the same for everyone and the server can render it. A local
 * time has to wait for the browser's clock, and a countdown beside it only ever
 * agreed with the chart for the ten minutes the tape was already behind.
 */
export const releaseStamp = (at: number) => `${UTC.format(new Date(at)).replace(",", "")} UTC`;

/** The red folder release nearest to now, before it and for a while after. */
const NewsStrip = ({ at, titles }: Props) => (
  <Link
    to={href("/red-folder-events")}
    className="flex h-8 shrink-0 items-center gap-2 rounded-lg border border-down/25 bg-down/15 px-3 text-xs transition-colors hover:bg-down/25 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
  >
    <span className="relative flex size-1.5 shrink-0" aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-down opacity-75" />
      <span className="relative inline-flex size-full rounded-full bg-down" />
    </span>
    <span className="shrink-0 font-medium text-down">Red folder news</span>
    <span className="truncate text-rose-300/90">{titles.join(", ")}</span>
    <span className="ml-auto shrink-0 text-rose-300/70 tabular">{releaseStamp(at)}</span>
  </Link>
);

export default NewsStrip;

import { useEffect, useState } from "react";
import { href, Link } from "react-router";

type Props = {
  at: number;
  titles: string[];
};

const countdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

/** Counts down to the next red folder release, once it is inside a day. */
const NewsStrip = ({ at, titles }: Props) => {
  // Null until the browser has the clock, or the server renders a different one.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(tick);
  }, []);

  return (
    <Link
      to={href("/calendar")}
      className="flex h-8 shrink-0 items-center gap-2 border-down/40 border-b bg-down/15 px-3 text-xs transition-colors hover:bg-down/25 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-down" aria-hidden="true" />
      <span className="shrink-0 font-medium text-down">Red folder news</span>
      <span className="truncate text-muted">{titles.join(", ")}</span>
      <span className="ml-auto shrink-0 text-ink tabular">
        {now === null ? "" : countdown(at - now)}
      </span>
    </Link>
  );
};

export default NewsStrip;

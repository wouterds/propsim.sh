import { useEffect, useState } from "react";
import { href, Link } from "react-router";

type Props = {
  at: number;
  titles: string[];
};

const pad = (value: number) => String(value).padStart(2, "0");

export const countdown = (ms: number) => {
  const left = Math.max(0, ms);
  const total = Math.floor(left / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const hundredths = Math.floor((left % 1000) / 10);
  const clock =
    hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;

  return `${clock}.${pad(hundredths)}`;
};

/** Local time, and only ever read on the client: the server sits in another one. */
const releaseTime = (at: number) =>
  new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

/** Counts down to the next red folder release, once it is inside a day. */
const NewsStrip = ({ at, titles }: Props) => {
  // Null until the browser has the clock, or the server renders a different one.
  const [now, setNow] = useState<number | null>(null);

  // A frame at a time, not a second: the hundredths would step in blocks of the
  // interval otherwise. rAF also stops while the tab is in the background.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setNow(Date.now());
      frame = requestAnimationFrame(tick);
    };

    tick();

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Link
      to={href("/red-folder-events")}
      className="flex h-8 shrink-0 items-center gap-2 rounded-lg border border-down/25 bg-down/15 px-3 text-xs transition-colors hover:bg-down/25 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
    >
      <span className="relative flex size-1.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-down opacity-75" />
        <span className="relative inline-flex size-full rounded-full bg-down" />
      </span>
      <span className="shrink-0 font-medium text-down">Red folder news</span>
      <span className="truncate text-down/55">{titles.join(", ")}</span>
      <span className="ml-auto shrink-0 text-down/75 tabular">
        {now === null ? "" : `${releaseTime(at)} · ${countdown(at - now)}`}
      </span>
    </Link>
  );
};

export default NewsStrip;

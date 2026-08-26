type Props = {
  /** The releases inside the window that is open right now. */
  titles: string[];
  /** Seconds until the window closes. */
  endsIn: number;
};

export const clock = (seconds: number) => {
  const safe = Math.max(0, seconds);

  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
};

const NewsBanner = ({ titles, endsIn }: Props) => (
  <output
    aria-live="assertive"
    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-down bg-down/15 px-3 py-2"
  >
    <span className="inline-flex items-center gap-2 font-medium text-down text-sm">
      <span className="size-2 animate-pulse rounded-full bg-down" aria-hidden="true" />
      Red folder news
    </span>

    <span className="text-rose-300/90 text-sm">{titles.join(", ")}</span>

    <span className="ml-auto text-rose-300/70 text-xs tabular">
      Be flat. Clear in {clock(endsIn)}
    </span>
  </output>
);

export default NewsBanner;

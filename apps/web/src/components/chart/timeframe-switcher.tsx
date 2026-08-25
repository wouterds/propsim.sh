import { Link, useNavigation, useSearchParams } from "react-router";
import { FOCUS_RING } from "~/components/trading/styles";
import { TIMEFRAMES, type Timeframe } from "~/components/trading/timeframes";
import { cn } from "~/lib/utils";

/** Links, not buttons. The timeframe is the loader's input, so it lives in the URL. */
const TimeframeSwitcher = ({ value }: { value: Timeframe }) => {
  const navigation = useNavigation();
  const [params] = useSearchParams();
  const pending = navigation.location
    ? new URLSearchParams(navigation.location.search).get("tf")
    : null;

  return (
    <nav className="flex items-center gap-0.5 rounded border border-line bg-raised/80 p-0.5 backdrop-blur">
      {TIMEFRAMES.map((timeframe) => {
        const active = timeframe === value;
        const loading = pending === timeframe && !active;

        return (
          <Link
            key={timeframe}
            to={`?${new URLSearchParams({ ...Object.fromEntries(params), tf: timeframe })}`}
            preventScrollReset
            className={cn(
              "rounded px-2 py-1 font-medium text-[11px] tabular transition-colors",
              active && "bg-accent/15 text-accent",
              !active && "text-muted hover:text-ink",
              loading && "text-accent/60",
              FOCUS_RING,
            )}
          >
            {timeframe}
          </Link>
        );
      })}
    </nav>
  );
};

export default TimeframeSwitcher;

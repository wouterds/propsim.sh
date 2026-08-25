import { Link, useNavigation } from "react-router";
import { FOCUS_RING } from "~/components/trading/styles";
import { SPANS, type Span } from "~/lib/leaderboard";
import { cn } from "~/lib/utils";

/** Links, not buttons. The span is the loader's input, so it lives in the URL. */
const SpanSwitcher = ({ value }: { value: Span }) => {
  const navigation = useNavigation();
  const pending = navigation.location
    ? new URLSearchParams(navigation.location.search).get("span")
    : null;

  return (
    <nav className="flex items-center gap-0.5 rounded border border-line bg-raised p-0.5">
      {SPANS.map((span) => {
        const active = span.id === value;
        const loading = pending === span.id && !active;

        return (
          <Link
            key={span.id}
            to={`?span=${span.id}`}
            preventScrollReset
            className={cn(
              "rounded px-3 py-1.5 font-medium text-xs transition-colors",
              active && "bg-line text-ink",
              !active && "text-muted hover:text-ink",
              loading && "text-accent/60",
              FOCUS_RING,
            )}
          >
            {span.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default SpanSwitcher;

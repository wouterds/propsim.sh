import { ChevronUp } from "lucide-react";
import { Link, useFetcher } from "react-router";
import { cn } from "~/lib/utils";

type Props = {
  votes: number;
  voted: boolean;
  /** The page that owns the action, and where a visitor lands back after signing in. */
  path: string;
  /** What the action reads, or nothing when there is nobody to vote as. */
  fields: Record<string, string> | null;
  shape?: "stacked" | "inline";
};

const BASE =
  "inline-flex shrink-0 select-none items-center justify-center border font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const SHAPE = {
  stacked: "h-12 w-11 flex-col gap-0.5 rounded-lg text-[13px]",
  inline: "h-7 gap-1.5 rounded-md px-2 text-xs",
};

const OFF = "border-line bg-raised text-muted hover:border-line-strong hover:text-ink";

const ON = "border-accent/40 bg-accent/12 text-ink";

const VoteButton = ({ votes, voted, path, fields, shape = "stacked" }: Props) => {
  const fetcher = useFetcher();

  // Answered here rather than after the round trip, or the arrow lags the click.
  const sending = fetcher.formData !== undefined;
  const on = sending ? !voted : voted;
  const count = sending ? votes + (voted ? -1 : 1) : votes;

  const className = cn(BASE, SHAPE[shape], on ? ON : OFF);

  const face = (
    <>
      <ChevronUp
        aria-hidden="true"
        strokeWidth={2.5}
        className={cn(shape === "stacked" ? "size-3.5" : "size-3", on && "text-accent")}
      />
      <span className="tabular">{count}</span>
    </>
  );

  if (!fields) {
    return (
      <Link
        to={`/auth?r=${encodeURIComponent(path)}`}
        aria-label={`Sign in to vote. ${count} so far`}
        className={className}
      >
        {face}
      </Link>
    );
  }

  return (
    <fetcher.Form method="post" action={path}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <button
        type="submit"
        aria-pressed={on}
        aria-label={`${on ? "Take your vote back" : "Vote for this"}. ${count} so far`}
        className={className}
      >
        {face}
      </button>
    </fetcher.Form>
  );
};

export default VoteButton;

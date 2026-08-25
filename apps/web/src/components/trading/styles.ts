import { cn } from "~/lib/utils";

// `outline-hidden`, not `outline-none`. Forced-colors mode drops the ring's
// box-shadow, and only the former leaves an outline to repaint.
export const FOCUS_RING = "outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

export const FIELD = cn(
  "h-8 w-full rounded border border-line bg-sunken px-2 text-ink text-sm tabular",
  "placeholder:text-faint focus-visible:border-accent",
  "disabled:cursor-not-allowed disabled:border-line/50 disabled:bg-base disabled:text-muted",
);

// Block with a fixed line box: the number field wraps its label in a scrub
// area and the select does not, and without one they sit on different lines.
export const LABEL = "block text-[11px] text-faint uppercase leading-4 tracking-wider";

export const TH =
  "h-8 whitespace-nowrap px-3 text-left font-normal text-[11px] text-faint uppercase tracking-wider";

export const TD = "h-8 whitespace-nowrap px-3 text-xs tabular";

export const ROW = "border-line/60 border-b last:border-b-0 hover:bg-overlay";

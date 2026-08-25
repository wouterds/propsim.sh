import { cn } from "~/lib/utils";

// `outline-hidden` rather than `outline-none`: forced-colors mode drops the
// box-shadow the ring is drawn with, and only the former leaves a transparent
// outline behind for the OS to repaint. `outline-none` leaves nothing at all.
export const FOCUS_RING = "outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

// A disabled field has to look inert. Without this it is pixel-identical to an
// editable one and the placeholder reads as a value already in the box.
export const FIELD = cn(
  "h-8 w-full rounded border border-line bg-sunken px-2 text-ink text-sm tabular",
  "placeholder:text-faint focus-visible:border-accent",
  "disabled:cursor-not-allowed disabled:border-line/50 disabled:bg-base disabled:text-muted",
);

export const LABEL = "text-[11px] text-faint uppercase tracking-wider";

export const TH =
  "h-8 whitespace-nowrap px-3 text-left font-normal text-[11px] text-faint uppercase tracking-wider";

export const TD = "h-8 whitespace-nowrap px-3 text-xs tabular";

export const ROW = "border-line/60 border-b last:border-b-0 hover:bg-overlay";

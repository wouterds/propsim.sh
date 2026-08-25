import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

type Tone = "up" | "down" | "warn" | "accent" | "muted";

type Props = {
  tone: Tone;
  dot?: boolean;
  children: ReactNode;
};

const TONE: Record<Tone, string> = {
  up: "bg-up/20 text-up",
  down: "bg-down/20 text-down",
  warn: "bg-warn/20 text-warn",
  accent: "bg-accent/20 text-accent",
  muted: "bg-overlay text-muted",
};

const DOT: Record<Tone, string> = {
  up: "bg-up",
  down: "bg-down",
  warn: "bg-warn",
  accent: "bg-accent",
  muted: "bg-line-strong",
};

const Badge = ({ tone, dot = false, children }: Props) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wider",
      TONE[tone],
    )}
  >
    {dot && <span className={cn("size-1.5 rounded-full", DOT[tone])} />}
    {children}
  </span>
);

export default Badge;

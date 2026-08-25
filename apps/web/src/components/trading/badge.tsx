import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

type Tone = "up" | "down" | "accent" | "warn" | "muted";

const TONES: Record<Tone, string> = {
  up: "bg-up/15 text-up",
  down: "bg-down/15 text-down",
  accent: "bg-accent/15 text-accent",
  warn: "bg-warn/15 text-warn",
  muted: "bg-overlay text-muted",
};

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span
    className={cn(
      "inline-flex items-center rounded px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wider",
      TONES[tone],
    )}
  >
    {children}
  </span>
);

export default Badge;

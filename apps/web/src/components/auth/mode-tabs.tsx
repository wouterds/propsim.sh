import { cn } from "~/lib/utils";
import type { AuthMode } from "./mode";

const TAB =
  "flex-1 rounded py-1.5 text-center text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const MODES: { mode: AuthMode; label: string }[] = [
  { mode: "login", label: "Log in" },
  { mode: "signup", label: "Create account" },
];

type Props = {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
};

const ModeTabs = ({ mode, onChange }: Props) => (
  <div className="mb-6 flex gap-1 rounded-lg border border-line bg-sunken p-1">
    {MODES.map((tab) => (
      <button
        key={tab.mode}
        type="button"
        onClick={() => onChange(tab.mode)}
        className={cn(
          TAB,
          tab.mode === mode ? "bg-accent font-medium text-sunken" : "text-muted hover:text-ink",
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default ModeTabs;

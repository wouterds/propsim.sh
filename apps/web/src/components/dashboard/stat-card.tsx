import { TONE_TEXT, type Tone } from "~/lib/format";
import { cn } from "~/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
};

const StatCard = ({ label, value, hint, tone = "neutral" }: Props) => (
  <div className="rounded-lg border border-line bg-raised p-4">
    <p className="text-[11px] text-faint uppercase tracking-wider">{label}</p>
    <p className={cn("mt-2 font-semibold text-2xl tabular", TONE_TEXT[tone])}>{value}</p>
    {hint && <p className="mt-1 text-faint text-xs">{hint}</p>}
  </div>
);

export default StatCard;

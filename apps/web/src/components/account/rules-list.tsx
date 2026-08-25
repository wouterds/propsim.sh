import Badge from "~/components/ui/badge";
import { VERDICT_TONE } from "~/lib/journal";
import type { Rule } from "~/lib/rules";

const LABEL = { clean: "Pass", watch: "Watch", breached: "Fail" } as const;

type Props = {
  rules: Rule[];
};

const RulesList = ({ rules }: Props) => (
  <div className="rounded-lg border border-line bg-raised">
    <div className="flex h-9 items-center border-line border-b px-4">
      <span className="text-[11px] text-faint uppercase tracking-wider">Account rules</span>
    </div>

    <ul className="divide-y divide-line/60">
      {rules.map((rule) => (
        <li key={rule.id} className="flex items-start justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-ink text-sm">{rule.label}</p>
            <p className="mt-0.5 text-faint text-xs leading-relaxed">{rule.detail}</p>
          </div>
          <Badge tone={VERDICT_TONE[rule.state]}>{LABEL[rule.state]}</Badge>
        </li>
      ))}
    </ul>
  </div>
);

export default RulesList;

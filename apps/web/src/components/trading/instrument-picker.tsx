import { Select } from "@base-ui/react/select";
import { GROUPS, INSTRUMENTS, type Instrument } from "./instruments";

type Props = {
  value: string;
  onChange: (code: string) => void;
};

const TRIGGER =
  "flex h-8 items-center gap-2 rounded border border-line bg-sunken px-2.5 text-ink text-sm outline-hidden transition-colors hover:border-line-strong focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent";

const byGroup = (group: Instrument["group"]) =>
  INSTRUMENTS.filter((instrument) => instrument.group === group);

const InstrumentPicker = ({ value, onChange }: Props) => (
  <Select.Root value={value} onValueChange={(next) => onChange(String(next))}>
    <Select.Trigger className={TRIGGER} aria-label="Contract">
      <Select.Value />
      <Select.Icon className="text-faint">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3">
          <path
            d="m4 6 4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Select.Icon>
    </Select.Trigger>

    <Select.Portal>
      <Select.Positioner sideOffset={4} className="z-50">
        <Select.Popup className="max-h-80 min-w-56 overflow-y-auto rounded border border-line bg-overlay p-1 shadow-[0_16px_40px_-24px_rgb(0_0_0)]">
          {GROUPS.map((group) => (
            <Select.Group key={group}>
              <Select.GroupLabel className="px-2 pt-2 pb-1 text-[11px] text-faint uppercase tracking-wider">
                {group}
              </Select.GroupLabel>

              {byGroup(group).map((instrument) => (
                <Select.Item
                  key={instrument.code}
                  value={instrument.code}
                  className="flex cursor-default items-baseline gap-2 rounded px-2 py-1.5 text-ink text-sm data-[highlighted]:bg-accent data-[highlighted]:text-sunken"
                >
                  <Select.ItemText>{instrument.code}</Select.ItemText>
                  <span className="ml-auto text-faint text-xs">{instrument.name}</span>
                </Select.Item>
              ))}
            </Select.Group>
          ))}
        </Select.Popup>
      </Select.Positioner>
    </Select.Portal>
  </Select.Root>
);

export default InstrumentPicker;

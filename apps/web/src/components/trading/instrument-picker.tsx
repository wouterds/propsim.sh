import { Select } from "@base-ui/react/select";
import { GROUPS, INSTRUMENTS, type Instrument } from "@propsim/engine";
import { ChevronDown } from "lucide-react";

type Props = {
  value: string;
  onChange: (code: string) => void;
};

// Sits in the chart bar in place of the symbol, so it reads as the label it
// replaced until it is hovered.
// The negative margin has to match the padding, or the fill grows the chart bar
// instead of sitting inside it.
const TRIGGER =
  "-my-1 -mx-1.5 flex items-center gap-1.5 rounded px-1.5 py-1 font-medium text-ink text-sm tracking-wide outline-hidden transition-colors hover:bg-line/60 focus-visible:ring-1 focus-visible:ring-accent";

const byGroup = (group: Instrument["group"]) =>
  INSTRUMENTS.filter((instrument) => instrument.group === group);

const InstrumentPicker = ({ value, onChange }: Props) => (
  <Select.Root value={value} onValueChange={(next) => onChange(String(next))}>
    <Select.Trigger className={TRIGGER} aria-label="Contract">
      <Select.Value />
      <Select.Icon className="text-faint">
        <ChevronDown aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
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
                  className="group flex cursor-default items-baseline gap-2 rounded px-2 py-1.5 text-ink text-sm data-[highlighted]:bg-accent data-[highlighted]:text-sunken"
                >
                  <Select.ItemText>{instrument.code}</Select.ItemText>
                  <span className="ml-auto text-faint text-xs group-data-[highlighted]:text-sunken/75">
                    {instrument.name}
                  </span>
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

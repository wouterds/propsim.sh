import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { useId } from "react";
import { cn } from "~/lib/utils";
import { FIELD, FOCUS_RING, LABEL } from "./styles";

type Props = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step: number;
  min?: number;
  placeholder?: string;
  disabled?: boolean;
  steppers?: boolean;
};

const STEPPER = cn(
  "flex h-8 w-8 shrink-0 items-center justify-center rounded border border-line",
  "text-muted hover:border-line-strong hover:text-ink disabled:opacity-40",
  FOCUS_RING,
);

const NumberField = ({
  label,
  value,
  onChange,
  step,
  min,
  placeholder,
  disabled,
  steppers,
}: Props) => {
  const id = useId();

  return (
    <BaseNumberField.Root
      id={id}
      value={value}
      onValueChange={(next) => onChange(next)}
      step={step}
      min={min}
      disabled={disabled}
      // Snapped to the step, or a sum of tick fractions drifts into 20124.749999999996.
      snapOnStep
      className="flex flex-col gap-1"
    >
      <BaseNumberField.ScrubArea>
        <label className={LABEL} htmlFor={id}>
          <BaseNumberField.ScrubAreaCursor />
          {label}
        </label>
      </BaseNumberField.ScrubArea>

      <BaseNumberField.Group className="flex items-center gap-1">
        {steppers && (
          <BaseNumberField.Decrement className={STEPPER} aria-label={`decrease ${label}`}>
            &minus;
          </BaseNumberField.Decrement>
        )}
        <BaseNumberField.Input
          placeholder={placeholder}
          className={cn(FIELD, FOCUS_RING, steppers && "text-center")}
        />
        {steppers && (
          <BaseNumberField.Increment className={STEPPER} aria-label={`increase ${label}`}>
            +
          </BaseNumberField.Increment>
        )}
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
};

export default NumberField;

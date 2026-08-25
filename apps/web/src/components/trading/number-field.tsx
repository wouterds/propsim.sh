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

  const nudge = (by: number) => {
    const next = (value ?? 0) + by;

    if (min !== undefined && next < min) return;

    // Steps are fractions of a tick, so the sum drifts into 20124.749999999996
    // without a round trip through the step size.
    onChange(Math.round(next / step) * step);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className={LABEL} htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-1">
        {steppers && (
          <button
            type="button"
            aria-label={`decrease ${label}`}
            className={STEPPER}
            disabled={disabled}
            onClick={() => nudge(-step)}
          >
            &minus;
          </button>
        )}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className={cn(FIELD, FOCUS_RING, steppers && "text-center")}
          step={step}
          min={min}
          value={value ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => {
            const raw = event.target.value;

            if (raw === "") {
              onChange(null);
              return;
            }

            const parsed = Number(raw);

            if (!Number.isFinite(parsed)) return;

            onChange(parsed);
          }}
        />
        {steppers && (
          <button
            type="button"
            aria-label={`increase ${label}`}
            className={STEPPER}
            disabled={disabled}
            onClick={() => nudge(step)}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};

export default NumberField;

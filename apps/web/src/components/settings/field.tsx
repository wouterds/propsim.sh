type Props = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  /** Keeps a password manager off a field that only looks like a credential. */
  private?: boolean;
};

const Field = ({
  name,
  label,
  type = "text",
  autoComplete,
  minLength,
  maxLength,
  defaultValue,
  placeholder,
  required = true,
  private: keptPrivate = false,
}: Props) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={name} className="text-muted text-xs">
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      autoComplete={autoComplete}
      minLength={minLength}
      maxLength={maxLength}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      // A manager that claims the field also takes the caret on load, and the
      // page opens with the cursor sitting in a name nobody came here to change.
      data-1p-ignore={keptPrivate || undefined}
      data-lpignore={keptPrivate ? "true" : undefined}
      data-form-type={keptPrivate ? "other" : undefined}
      className="h-10 w-full rounded border border-line bg-sunken px-3 text-ink text-sm outline-hidden transition-colors focus-visible:border-accent focus-visible:ring-[0.5px] focus-visible:ring-accent"
    />
  </div>
);

export default Field;

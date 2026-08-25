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
      className="h-10 w-full rounded border border-line bg-sunken px-3 text-ink text-sm outline-hidden transition-colors focus-visible:border-accent focus-visible:ring-[0.5px] focus-visible:ring-accent"
    />
  </div>
);

export default Field;

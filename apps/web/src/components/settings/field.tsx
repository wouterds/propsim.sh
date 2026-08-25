type Props = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  defaultValue?: string;
};

const Field = ({ name, label, type = "text", autoComplete, minLength, defaultValue }: Props) => (
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
      defaultValue={defaultValue}
      required
      className="h-10 w-full rounded border border-line bg-sunken px-3 text-ink text-sm outline-hidden transition-colors focus-visible:border-accent focus-visible:ring-[0.5px] focus-visible:ring-accent"
    />
  </div>
);

export default Field;

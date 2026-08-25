type Props = {
  kind: string | null;
};

const PATHS: Record<string, string> = {
  desktop: "M2 3.5h12v7H2zM6 13h4M8 10.5V13",
  mobile: "M5.5 1.5h5v13h-5zM7 12.8h2",
  tablet: "M3.5 1.5h9v13h-9zM7 12.8h2",
  bot: "M3 5.5h10v7H3zM6 8.5h.01M10 8.5h.01M8 3v2.5",
};

const DeviceIcon = ({ kind }: Props) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 text-faint">
    <path
      d={PATHS[kind ?? ""] ?? PATHS.desktop}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default DeviceIcon;

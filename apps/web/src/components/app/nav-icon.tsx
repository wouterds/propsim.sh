export type NavIconName = "overview" | "accounts" | "user" | "logout";

const PATHS: Record<NavIconName, string> = {
  overview: "M2.5 2.5h4v4h-4zM9.5 2.5h4v4h-4zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z",
  accounts: "M8 2 13.5 5 8 8 2.5 5zM2.5 8 8 11l5.5-3M2.5 11 8 14l5.5-3",
  user: "M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 13.5c0-2 2-3.2 4.5-3.2s4.5 1.2 4.5 3.2",
  logout: "M6.5 3.5h-3v9h3M9.5 5.5 12 8l-2.5 2.5M12 8H6",
};

type Props = {
  name: NavIconName;
};

const NavIcon = ({ name }: Props) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0">
    <path
      d={PATHS[name]}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default NavIcon;

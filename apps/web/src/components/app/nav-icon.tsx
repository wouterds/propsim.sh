import { Layers, LayoutGrid, LogOut, User } from "lucide-react";

export type NavIconName = "overview" | "accounts" | "user" | "logout";

const ICONS = {
  overview: LayoutGrid,
  accounts: Layers,
  user: User,
  logout: LogOut,
};

type Props = {
  name: NavIconName;
};

const NavIcon = ({ name }: Props) => {
  const Icon = ICONS[name];

  return <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />;
};

export default NavIcon;

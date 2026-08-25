import { Bot, Monitor, Smartphone, Tablet } from "lucide-react";

type Props = {
  kind: string | null;
};

const ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  bot: Bot,
};

const DeviceIcon = ({ kind }: Props) => {
  const Icon = ICONS[kind as keyof typeof ICONS] ?? Monitor;

  return <Icon aria-hidden="true" className="size-4 shrink-0 text-faint" strokeWidth={1.5} />;
};

export default DeviceIcon;

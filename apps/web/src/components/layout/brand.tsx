import { cn } from "~/lib/utils";

type Props = {
  className?: string;
};

const Brand = ({ className }: Props) => (
  <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
    <svg viewBox="0 0 20 20" className="h-[1.1em] w-[1.1em]" role="img" aria-label="propsim.sh">
      <title>propsim.sh</title>
      <rect x="3" y="7" width="4" height="9" rx="1" className="fill-up" />
      <rect x="4.5" y="3" width="1" height="14" className="fill-up" />
      <rect x="13" y="4" width="4" height="8" rx="1" className="fill-down" />
      <rect x="14.5" y="2" width="1" height="15" className="fill-down" />
    </svg>
    <span>
      propsim<span className="text-faint">.sh</span>
    </span>
  </span>
);

export default Brand;

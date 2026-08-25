import { cn } from "~/lib/utils";

type Props = {
  className?: string;
};

const Brand = ({ className }: Props) => (
  <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
    <svg viewBox="0 0 20 20" className="h-[1.1em] w-[1.1em]" role="img" aria-label="propsim.sh">
      <title>propsim.sh</title>
      <rect x="3.5" y="7" width="1" height="11" className="fill-down" />
      <rect x="2" y="9" width="4" height="7" rx="1" className="fill-down" />
      <rect x="9.5" y="4" width="1" height="11" className="fill-up" />
      <rect x="8" y="6" width="4" height="7" rx="1" className="fill-up" />
      <rect x="15.5" y="2" width="1" height="10" className="fill-up" />
      <rect x="14" y="3" width="4" height="7" rx="1" className="fill-up" />
    </svg>
    <span>
      propsim<span className="text-faint">.sh</span>
    </span>
  </span>
);

export default Brand;

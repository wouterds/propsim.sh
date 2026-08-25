import { cn } from "~/lib/utils";

type Props = {
  className?: string;
};

const Brand = ({ className }: Props) => (
  <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
    <svg viewBox="0 0 20 20" className="h-[1.1em] w-[1.1em]" role="img" aria-label="propsim.sh">
      <title>propsim.sh</title>
      <rect x="4.5" y="8" width="1" height="10" className="fill-down" />
      <rect x="3" y="10" width="4" height="6" rx="1" className="fill-down" />
      <rect x="9.5" y="3" width="1" height="12" className="fill-up" />
      <rect x="8" y="5" width="4" height="8" rx="1" className="fill-up" />
      <rect x="14.5" y="5" width="1" height="10" className="fill-down" />
      <rect x="13" y="7" width="4" height="6" rx="1" className="fill-down" />
    </svg>
    <span>
      propsim<span className="text-faint">.sh</span>
    </span>
  </span>
);

export default Brand;

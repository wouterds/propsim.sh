import { cn } from "~/lib/utils";

type Props = {
  className?: string;
};

const GridBackdrop = ({ className }: Props) => (
  <div
    aria-hidden="true"
    className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
  >
    <div className="absolute inset-0 [background-image:linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] [background-size:56px_56px] opacity-60 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" />
    <div className="-translate-x-1/2 absolute top-[-14rem] left-1/2 h-[26rem] w-[42rem] rounded-full bg-accent/10 blur-[120px]" />
    <div className="absolute top-[6rem] right-[-8rem] h-[20rem] w-[20rem] rounded-full bg-accent/5 blur-[120px]" />
  </div>
);

export default GridBackdrop;

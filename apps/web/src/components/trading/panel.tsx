import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { LABEL } from "./styles";

type Props = {
  title?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

const Panel = ({ title, actions, className, bodyClassName, children }: Props) => (
  <section className={cn("flex flex-col rounded-lg border border-line bg-raised", className)}>
    {(title || actions) && (
      <header
        className={cn(
          "flex h-9 shrink-0 items-center justify-between gap-3 border-line border-b px-3",
          LABEL,
        )}
      >
        <span>{title}</span>
        {actions}
      </header>
    )}
    <div className={cn("p-3", bodyClassName)}>{children}</div>
  </section>
);

export default Panel;

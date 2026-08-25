import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";
import { FOCUS_RING } from "./styles";

type Variant = "primary" | "buy" | "sell" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent-strong text-ink hover:bg-accent-strong/85",
  buy: "bg-up text-ink hover:bg-up/85",
  sell: "bg-down text-ink hover:bg-down/85",
  ghost: "border border-line text-muted hover:border-line-strong hover:text-ink",
  danger: "border border-down/40 text-down hover:bg-down/10",
};

type Props = ComponentProps<"button"> & { variant?: Variant; block?: boolean };

const Button = ({ variant = "ghost", block, className, type = "button", ...rest }: Props) => (
  <button
    type={type === "submit" ? "submit" : "button"}
    className={cn(
      "inline-flex h-8 items-center justify-center gap-1.5 rounded px-3 font-medium text-xs",
      "transition-colors disabled:cursor-not-allowed disabled:opacity-40",
      VARIANTS[variant],
      block && "w-full",
      FOCUS_RING,
      className,
    )}
    {...rest}
  />
);

export default Button;

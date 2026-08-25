import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names and lets the last conflicting tailwind utility win, so a
 * `className` prop can override a component's own padding or colour without
 * both landing in the markup and the cascade picking by source order.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

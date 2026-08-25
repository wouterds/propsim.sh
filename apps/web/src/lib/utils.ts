import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges class names and lets the last conflicting tailwind utility win. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

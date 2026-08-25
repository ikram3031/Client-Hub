import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges class names with Tailwind CSS resolution
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

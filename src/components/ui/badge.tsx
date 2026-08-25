import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "emerald" | "purple" | "cyan" | "amber";
}

// Reusable Badge component for scopes, statuses, and tags
export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  const variantStyles = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border text-foreground",
    destructive: "bg-destructive/10 text-destructive border border-destructive/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono transition-colors select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "emerald" | "purple";
  size?: "default" | "sm" | "lg" | "icon";
}

// Standard Button component supporting multiple variants and sizes
export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}) => {
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-98",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-98",
    outline: "border border-border bg-background hover:bg-muted hover:text-foreground active:scale-98 shadow-xs",
    ghost: "hover:bg-muted hover:text-foreground",
    destructive: "bg-destructive text-white hover:bg-destructive/90 shadow-xs",
    emerald: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs active:scale-98",
    purple: "bg-purple-600 text-white hover:bg-purple-500 shadow-xs active:scale-98",
  };

  const sizeStyles = {
    default: "h-9 px-4 py-2 text-xs font-semibold rounded-lg",
    sm: "h-7 px-2.5 text-xs font-medium rounded-md",
    lg: "h-11 px-6 text-sm font-semibold rounded-xl",
    icon: "h-8 w-8 p-0 rounded-lg flex items-center justify-center",
  };

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
};

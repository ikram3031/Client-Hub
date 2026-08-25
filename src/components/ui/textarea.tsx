import React from "react";
import { cn } from "@/lib/utils";

// Standard Textarea component
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 custom-scrollbar",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// Standard Separator component
export const Separator: React.FC<React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }> = ({
  className,
  orientation = "horizontal",
  ...props
}) => (
  <div
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props}
  />
);

// Standard Skeleton component
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("animate-pulse rounded-md bg-muted/60", className)} {...props} />
);

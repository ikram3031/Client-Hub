import React from "react";
import { cn } from "@/lib/utils";

// Card container component
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props} />
);

// Card header component
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-5", className)} {...props} />
);

// Card title component
export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn("font-bold leading-none tracking-tight text-foreground", className)} {...props} />
);

// Card description component
export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn("text-xs text-muted-foreground leading-relaxed", className)} {...props} />
);

// Card content component
export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("p-5 pt-0", className)} {...props} />
);

// Card footer component
export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex items-center p-5 pt-0", className)} {...props} />
);

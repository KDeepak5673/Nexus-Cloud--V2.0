"use client";

import React from "react";
import { cn } from "../../lib/utils.js";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const variants: Record<string, string> = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-foreground text-background",
  };

  return <span className={cn(base, variants[variant] ?? variants.default, className)} {...props} />;
}

export default Badge;

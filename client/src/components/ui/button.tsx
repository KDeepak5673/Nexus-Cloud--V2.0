"use client";

import React from "react";
import { cn } from "../../lib/utils.js";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";
    const variants: Record<string, string> = {
      default: "bg-primary text-primary-foreground",
      outline: "bg-background text-foreground border border-input",
      secondary: "bg-secondary text-secondary-foreground",
    };
    const sizes: Record<string, string> = {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant] ?? variants.default, sizes[size] ?? sizes.md, className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;

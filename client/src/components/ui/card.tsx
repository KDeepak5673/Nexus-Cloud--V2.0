"use client";

import React from "react";
import { cn } from "../../lib/utils.js";

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl bg-card/30 border border-border/50", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-4 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-4 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export default Card;

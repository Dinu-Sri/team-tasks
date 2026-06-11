import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand/12 text-brand",
        secondary: "border-border bg-surface text-muted-foreground",
        warning: "border-warning/20 bg-warning/12 text-warning",
        danger: "border-danger/20 bg-danger/12 text-danger",
        success: "border-success/20 bg-success/12 text-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring/35 focus:ring-offset-0",
  {
    variants: {
      variant: {
        default: "border-primary/35 bg-primary/12 text-foreground shadow-[0_10px_18px_-16px_hsl(var(--paper-shadow)/0.7)] dark:border-primary/35 dark:bg-primary/20 dark:text-foreground",
        secondary: "border-secondary/35 bg-secondary/90 text-secondary-foreground dark:border-secondary/35 dark:bg-secondary/22 dark:text-foreground",
        destructive: "border-destructive/45 bg-destructive/14 text-destructive dark:bg-destructive/22 dark:text-red-100",
        outline: "border-foreground/12 bg-[hsl(var(--paper-strong))] text-foreground",
        success: "border-success/45 bg-success/14 text-success dark:bg-success/22 dark:text-emerald-100",
        theater: "border-violet-300/40 bg-violet-100 text-violet-800 dark:border-violet-300/18 dark:bg-violet-500/18 dark:text-violet-100",
        presentation: "border-sky-300/40 bg-sky-100 text-sky-800 dark:border-sky-300/18 dark:bg-sky-500/18 dark:text-sky-100",
        lecture: "border-emerald-300/40 bg-emerald-100 text-emerald-800 dark:border-emerald-300/18 dark:bg-emerald-500/18 dark:text-emerald-100",
        fair: "border-amber-300/40 bg-amber-100 text-amber-800 dark:border-amber-300/18 dark:bg-amber-500/18 dark:text-amber-100",
        workshop: "border-blue-300/40 bg-blue-100 text-blue-800 dark:border-blue-300/18 dark:bg-blue-500/18 dark:text-blue-100",
        exhibition: "border-fuchsia-300/40 bg-fuchsia-100 text-fuchsia-800 dark:border-fuchsia-300/18 dark:bg-fuchsia-500/18 dark:text-fuchsia-100",
        sports: "border-lime-300/50 bg-lime-100 text-lime-800 dark:border-lime-300/18 dark:bg-lime-500/18 dark:text-lime-100",
        otherCategory: "border-slate-300/50 bg-slate-100 text-slate-800 dark:border-slate-300/18 dark:bg-slate-500/18 dark:text-slate-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

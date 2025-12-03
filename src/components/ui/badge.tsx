import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants for CRM pipeline
        new: "border-transparent bg-[hsl(199,89%,48%)]/10 text-[hsl(199,89%,48%)]",
        contacted: "border-transparent bg-[hsl(263,70%,50%)]/10 text-[hsl(263,70%,50%)]",
        offer: "border-transparent bg-[hsl(24,95%,53%)]/10 text-[hsl(24,95%,53%)]",
        contract: "border-transparent bg-[hsl(172,66%,42%)]/10 text-[hsl(172,66%,42%)]",
        closed: "border-transparent bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)]",
        lost: "border-transparent bg-[hsl(0,84%,60%)]/10 text-[hsl(0,84%,60%)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

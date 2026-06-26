import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const customerBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
  {
    variants: {
      tier: {
        premium: "border-success/20 bg-success/10 text-success",
        top_buyer: "border-success/20 bg-success/10 text-success",
        new_customer: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      tier: "new_customer",
    },
  }
)

export type CustomerBadgeTier = NonNullable<
  VariantProps<typeof customerBadgeVariants>["tier"]
>

interface CustomerBadgeProps {
  tier: CustomerBadgeTier
  label: string
  className?: string
}

export function CustomerBadge({ tier, label, className }: CustomerBadgeProps) {
  return (
    <span className={cn(customerBadgeVariants({ tier }), className)}>{label}</span>
  )
}

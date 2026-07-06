import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
  {
    variants: {
      status: {
        paid: "border-success/20 bg-success/10 text-success",
        overdue: "border-destructive/20 bg-destructive/10 text-destructive",
        synced: "border-success/20 bg-success/10 text-success",
        pending: "border-warning/30 bg-warning/15 dark:text-warning  text-warning-foreground",
        error: "border-destructive/20 bg-destructive/10 text-destructive",
        failed: "border-destructive/20 bg-destructive/10 text-destructive",
        unmapped: "border-destructive/20 bg-destructive/10 text-destructive",
        draft: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
)

export type StatusBadgeVariant = NonNullable<
  VariantProps<typeof statusBadgeVariants>["status"]
>

interface StatusBadgeProps {
  status: StatusBadgeVariant
  label: string
  className?: string
  showDot?: boolean
}

export function StatusBadge({ status, label, className, showDot = false }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {showDot ? (
        <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      ) : null}
      {label}
    </span>
  )
}

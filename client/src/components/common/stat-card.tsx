import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  iconWrapperClassName?: string
  footer?: ReactNode
  trend?: {
    value: string
    isPositive?: boolean
  }
  children?: ReactNode
  className?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconWrapperClassName,
  footer,
  trend,
  children,
  className,
  onClick,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {title}
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="font-heading text-2xl font-semibold tracking-tight">
              {value}
            </p>
            {trend ? (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.value}
              </span>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary",
            iconWrapperClassName
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
      </div>

      {children}
      {footer ? (
        <p className="text-xs text-muted-foreground">{footer}</p>
      ) : null}
    </>
  )

  const cardClassName = cn(
    "flex flex-col gap-4 border border-border bg-card p-5 text-left shadow-sm",
    onClick &&
      "cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClassName}>
        {content}
      </button>
    )
  }

  return <div className={cardClassName}>{content}</div>
}

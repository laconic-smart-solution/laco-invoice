import { ArrowLeft } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UserFormPageLayoutProps {
  backHref: string
  backLabel: string
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export function UserFormPageLayout({
  backHref,
  backLabel,
  title,
  subtitle,
  children,
  actions,
  className,
}: UserFormPageLayoutProps) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="h-8 gap-2 px-2" asChild>
          <Link to={backHref}>
            <ArrowLeft className="size-4" aria-hidden />
            {backLabel}
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>

      <div className="border border-border bg-card p-6 shadow-sm">{children}</div>
    </div>
  )
}

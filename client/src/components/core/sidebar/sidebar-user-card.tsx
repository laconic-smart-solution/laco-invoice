import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import type { UserRole } from "@/shared/types/auth.types"
import { useAuthStore } from "@/shared/stores/auth-store"

interface SidebarUserCardProps {
  className?: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getRoleLabelKey(role: UserRole): string {
  return `user.roles.${role.toLowerCase()}`
}

export function SidebarUserCard({ className }: SidebarUserCardProps) {
  const { t } = useTranslation("sidebar")
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return null
  }

  const displayName = user.fullName?.trim() || user.email
  const subtitle = user.fullName?.trim()
    ? user.email
    : t(getRoleLabelKey(user.role))

  return (
    <div
      className={cn(
        "flex items-center gap-3 border border-border bg-card p-3",
        className
      )}
    >
      <div
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
      >
        {getInitials(displayName)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

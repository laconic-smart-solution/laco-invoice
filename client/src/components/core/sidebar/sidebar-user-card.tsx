import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/shared/types/auth.types"
import { useAuthStore } from "@/shared/stores/auth-store"

interface SidebarUserCardProps {
  className?: string
  isCollapsed?: boolean
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

export function SidebarUserCard({ className, isCollapsed = false }: SidebarUserCardProps) {
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
    <NavLink
      to={ROUTES.dashboard.profile}
      className={cn(
        "flex items-center border border-border bg-card outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
        isCollapsed ? "justify-center p-2" : "gap-3 p-3",
        className
      )}
      title={isCollapsed ? displayName : t("nav.profile")}
    >
      <div
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
      >
        {getInitials(displayName)}
      </div>
      <div
        className={cn(
          "min-w-0 overflow-hidden motion-safe:transition-[opacity,width] motion-safe:duration-200",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}
        aria-hidden={isCollapsed}
      >
        <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </NavLink>
  )
}

import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"

import { SIDEBAR_NAV_ITEMS } from "@/constants/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/shared/stores/auth-store"

interface SidebarNavProps {
  isCollapsed?: boolean
}

export function SidebarNav({ isCollapsed = false }: SidebarNavProps) {
  const { t } = useTranslation("sidebar")
  const userRole = useAuthStore((state) => state.user?.role)

  const navItems = SIDEBAR_NAV_ITEMS.filter(
    (item) => !item.adminOnly || userRole === "ADMIN"
  )

  return (
    <nav
      className={cn("flex-1 overflow-y-auto py-2", isCollapsed ? "px-2" : "px-3")}
      aria-label={t("nav_label")}
    >
      <ul className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const label = t(`nav.${item.key}`)

          return (
            <li key={item.key}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                aria-label={label}
                title={isCollapsed ? label : undefined}
              >
                {({ isActive }) => (
                  <span
                    className={cn(
                      "relative flex items-center text-sm font-medium transition-colors",
                      isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                      isActive
                        ? "bg-sidebar-accent text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "overflow-hidden whitespace-nowrap motion-safe:transition-[opacity,width] motion-safe:duration-200",
                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                      )}
                      aria-hidden={isCollapsed}
                    >
                      {label}
                    </span>
                    {isActive ? (
                      <span
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 bg-primary",
                          isCollapsed
                            ? "left-0 h-full w-0.5"
                            : "right-0 h-7 w-0.5"
                        )}
                        aria-hidden
                      />
                    ) : null}
                  </span>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

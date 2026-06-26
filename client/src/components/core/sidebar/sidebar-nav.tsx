import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"

import { SIDEBAR_NAV_ITEMS } from "@/constants/navigation"
import { cn } from "@/lib/utils"

export function SidebarNav() {
  const { t } = useTranslation("sidebar")

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      <ul className="space-y-1">
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const Icon = item.icon

          return (
            <li key={item.key}>
              <NavLink to={item.path} end={item.path === "/"}>
                {({ isActive }) => (
                  <span
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
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
                    <span>{t(`nav.${item.key}`)}</span>
                    {isActive ? (
                      <span
                        className="absolute top-1/2 right-0 h-7 w-0.5 -translate-y-1/2 bg-primary"
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

import { ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, useLocation } from "react-router-dom"

import { SIDEBAR_NAV_ITEMS, type SidebarNavItem } from "@/constants/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/shared/stores/auth-store"

interface SidebarNavProps {
  isCollapsed?: boolean
}

function isPathActive(pathname: string, path: string, end = false) {
  if (end || path === "/") {
    return pathname === path
  }
  return pathname === path || pathname.startsWith(`${path}/`)
}

function isGroupActive(pathname: string, item: SidebarNavItem) {
  if (item.children?.length) {
    return item.children.some((child) => isPathActive(pathname, child.path))
  }
  return isPathActive(pathname, item.path, item.path === "/")
}

export function SidebarNav({ isCollapsed = false }: SidebarNavProps) {
  const { t } = useTranslation("sidebar")
  const { pathname } = useLocation()
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
        {navItems.map((item) =>
          item.children?.length ? (
            <SidebarNavGroup
              key={item.key}
              item={item}
              isCollapsed={isCollapsed}
              pathname={pathname}
            />
          ) : (
            <li key={item.key}>
              <SidebarLeafLink
                path={item.path}
                icon={item.icon}
                label={t(`nav.${item.key}`)}
                isCollapsed={isCollapsed}
                end={item.path === "/"}
              />
            </li>
          )
        )}
      </ul>
    </nav>
  )
}

interface SidebarNavGroupProps {
  item: SidebarNavItem
  isCollapsed: boolean
  pathname: string
}

function SidebarNavGroup({ item, isCollapsed, pathname }: SidebarNavGroupProps) {
  const { t } = useTranslation("sidebar")
  const Icon = item.icon
  const label = t(`nav.${item.key}`)
  const groupActive = isGroupActive(pathname, item)
  const [open, setOpen] = useState(groupActive)

  useEffect(() => {
    if (groupActive) {
      setOpen(true)
    }
  }, [groupActive])

  if (isCollapsed) {
    return (
      <li>
        <SidebarLeafLink
          path={item.path}
          icon={item.icon}
          label={label}
          isCollapsed
          end={false}
        />
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={label}
        className={cn(
          "relative flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
          groupActive
            ? "bg-sidebar-accent text-primary"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
        )}
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            groupActive ? "text-primary" : "text-muted-foreground"
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <ChevronRight
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-90"
          )}
          aria-hidden
        />
        {groupActive ? (
          <span
            className="absolute top-1/2 right-0 h-7 w-0.5 -translate-y-1/2 bg-primary"
            aria-hidden
          />
        ) : null}
      </button>

      {open ? (
        <ul className="relative ml-5 space-y-0.5 border-l border-border py-1 pl-3">
          {item.children?.map((child) => {
            const childLabel = t(`nav.${child.key}`)
            return (
              <li key={child.key}>
                <NavLink to={child.path} end={child.path === item.path}>
                  {({ isActive }) => (
                    <span
                      className={cn(
                        "flex items-center px-2 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {childLabel}
                    </span>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      ) : null}
    </li>
  )
}

interface SidebarLeafLinkProps {
  path: string
  icon: SidebarNavItem["icon"]
  label: string
  isCollapsed: boolean
  end: boolean
}

function SidebarLeafLink({
  path,
  icon: Icon,
  label,
  isCollapsed,
  end,
}: SidebarLeafLinkProps) {
  return (
    <NavLink to={path} end={end} aria-label={label} title={isCollapsed ? label : undefined}>
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
                isCollapsed ? "left-0 h-full w-0.5" : "right-0 h-7 w-0.5"
              )}
              aria-hidden
            />
          ) : null}
        </span>
      )}
    </NavLink>
  )
}

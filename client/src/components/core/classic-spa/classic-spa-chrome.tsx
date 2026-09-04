import { ChevronDown, LogOut, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { NavbarColorThemeToggle } from "@/components/core/navbar/navbar-color-theme-toggle"
import { NavbarLanguageToggle } from "@/components/core/navbar/navbar-language-toggle"
import { NavbarThemeToggle } from "@/components/core/navbar/navbar-theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SIDEBAR_NAV_ITEMS, type SidebarNavItem } from "@/constants/navigation"
import {
  CLASSIC_NAV_PANEL_BY_KEY,
  classicPanelPath,
  parseClassicRoute,
} from "@/features/classic-spa/util/classic-route"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/shared/stores/auth-store"
import { useClassicWorkspaceStore } from "@/shared/stores/classic-workspace-store"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function isPathUnder(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

/**
 * Hongta-inspired classic SPA chrome: dense horizontal module tabs,
 * secondary utility bar — no left sidebar.
 */
export function ClassicSpaChrome() {
  const { t } = useTranslation(["common", "sidebar", "navbar", "shortcuts"])
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const setPanel = useClassicWorkspaceStore((state) => state.setPanel)
  const userRole = user?.role
  const displayName = user?.fullName?.trim() || user?.email || ""
  const activeRoute = parseClassicRoute(pathname)

  const navItems = SIDEBAR_NAV_ITEMS.filter(
    (item) => !item.adminOnly || userRole === "ADMIN"
  )

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.auth.login)
  }

  return (
    <header className="shrink-0 border-b border-border bg-background">
      <div className="flex items-stretch gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
        <Link
          to={ROUTES.dashboard.root}
          onClick={() => setPanel("overview")}
          className="flex shrink-0 items-center gap-2 px-2 py-1.5"
        >
          <span className="font-heading text-sm font-semibold tracking-tight text-foreground">
            {t("common:app.name")}
          </span>
          <span className="hidden text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:inline">
            {t("sidebar:tagline")}
          </span>
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center gap-1"
          aria-label={t("sidebar:nav_label")}
        >
          {navItems.map((item) =>
            item.children?.length ? (
              <ClassicNavDropdown
                key={item.key}
                item={item}
                pathname={pathname}
                activePanel={activeRoute?.panel ?? null}
              />
            ) : (
              <ClassicNavItem
                key={item.key}
                item={item}
                pathname={pathname}
                activePanel={activeRoute?.panel ?? null}
              />
            )
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5">
        <p className="mr-auto text-[11px] text-muted-foreground">
          {t("shortcuts:classic_shell.hint")}
        </p>
        <NavbarLanguageToggle />
        <NavbarColorThemeToggle />
        <NavbarThemeToggle />
        {displayName ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground"
                aria-label={t("navbar:view_profile")}
              >
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-36 truncate text-xs md:inline">
                  {displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={ROUTES.dashboard.profile}>
                  <UserRound aria-hidden />
                  {t("navbar:profile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut aria-hidden />
                {t("navbar:logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  )
}

interface ClassicNavItemProps {
  item: SidebarNavItem
  pathname: string
  activePanel: string | null
}

function ClassicNavItem({ item, pathname, activePanel }: ClassicNavItemProps) {
  const { t } = useTranslation("sidebar")
  const navigate = useNavigate()
  const setPanel = useClassicWorkspaceStore((state) => state.setPanel)
  const Icon = item.icon
  const label = t(`nav.${item.key}`)
  const panel = CLASSIC_NAV_PANEL_BY_KEY[item.key]
  const isActive =
    panel != null
      ? activePanel === panel
      : isPathUnder(pathname, item.path)

  if (panel != null) {
    return (
      <button
        type="button"
        onClick={() => {
          setPanel(panel)
          void navigate(classicPanelPath(panel), { replace: true })
        }}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
          isActive
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </button>
    )
  }

  return (
    <Link
      to={item.path}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </Link>
  )
}

interface ClassicNavDropdownProps {
  item: SidebarNavItem
  pathname: string
  activePanel: string | null
}

function ClassicNavDropdown({
  item,
  pathname,
  activePanel,
}: ClassicNavDropdownProps) {
  const { t } = useTranslation("sidebar")
  const navigate = useNavigate()
  const setPanel = useClassicWorkspaceStore((state) => state.setPanel)
  const Icon = item.icon
  const label = t(`nav.${item.key}`)
  const panel = CLASSIC_NAV_PANEL_BY_KEY[item.key]
  const childActive = item.children?.some((child) =>
    isPathUnder(pathname, child.path)
  )
  const isActive =
    (panel != null && activePanel === panel) || Boolean(childActive)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
            isActive
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="size-3.5 shrink-0" aria-hidden />
          {label}
          <ChevronDown className="size-3 shrink-0 opacity-80" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48 rounded-none">
        {item.children?.map((child) => {
          const childLabel = t(`nav.${child.key}`)
          const childIsList = child.path === item.path
          const childIsActive = childIsList
            ? Boolean(
                panel != null &&
                  activePanel === panel &&
                  !pathname.startsWith(ROUTES.dashboard.orderImports) &&
                  !pathname.startsWith(ROUTES.dashboard.orderInputs)
              )
            : isPathUnder(pathname, child.path)

          return (
            <DropdownMenuItem
              key={child.key}
              className={cn(childIsActive && "bg-accent text-accent-foreground")}
              onSelect={() => {
                if (childIsList && panel != null) {
                  setPanel(panel)
                  void navigate(classicPanelPath(panel), { replace: true })
                  return
                }
                void navigate(child.path)
              }}
            >
              {childLabel}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

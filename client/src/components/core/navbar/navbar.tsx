import { Bell, CircleHelp, CirclePlus, LogOut, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { NavbarLanguageToggle } from "@/components/core/navbar/navbar-language-toggle"
import { NavbarThemeToggle } from "@/components/core/navbar/navbar-theme-toggle"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/shared/stores/auth-store"

interface NavbarSearchProps {
  className?: string
}

function NavbarSearch({ className }: NavbarSearchProps) {
  const { t } = useTranslation("navbar")

  return (
    <InputGroup className={cn("h-10 bg-muted/50", className)}>
      <InputGroupAddon align="inline-start">
        <Search className="size-4 text-muted-foreground" aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        placeholder={t("search_placeholder")}
        className="h-10 bg-transparent"
        aria-label={t("search_placeholder")}
      />
    </InputGroup>
  )
}

function NavbarSyncStatus() {
  const { t } = useTranslation("navbar")

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      {t("syncing")}
    </div>
  )
}

export function Navbar() {
  const { t } = useTranslation("navbar")
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const displayName = user?.fullName?.trim() || user?.email || ""

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.auth.login)
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-6">
      <div className="flex min-w-0 flex-1 items-center">
        <NavbarSearch className="w-full max-w-xl" />
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NavbarSyncStatus />

        <NavbarLanguageToggle />
        <NavbarThemeToggle />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label={t("notifications")}
        >
          <Bell className="size-4" aria-hidden />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label={t("help")}
        >
          <CircleHelp className="size-4" aria-hidden />
        </Button>

        <Button type="button" className="h-9 gap-2 px-3">
          <CirclePlus className="size-4" aria-hidden />
          <span className="hidden sm:inline">{t("generate_invoice")}</span>
        </Button>

        {displayName ? (
          <div className="hidden items-center gap-2 border-l border-border pl-3 md:flex">
            <Link
              to={ROUTES.dashboard.profile}
              className="max-w-40 truncate text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("view_profile")}
            >
              {displayName}
            </Link>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label={t("logout")}
              onClick={handleLogout}
            >
              <LogOut className="size-4" aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  )
}

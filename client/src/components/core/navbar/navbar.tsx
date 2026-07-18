import { Bell, CircleHelp, CirclePlus, LogOut, Search, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
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
          <div className="flex items-center border-l border-border pl-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 gap-2 px-2 text-muted-foreground hover:text-foreground"
                  aria-label={t("view_profile")}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-40 truncate text-sm md:inline">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to={ROUTES.dashboard.profile}>
                    <UserRound aria-hidden />
                    {t("profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut aria-hidden />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
    </header>
  )
}

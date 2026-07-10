import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/shared/stores/auth-store"

interface SidebarLogoutButtonProps {
  className?: string
  isCollapsed?: boolean
}

export function SidebarLogoutButton({
  className,
  isCollapsed = false,
}: SidebarLogoutButtonProps) {
  const { t } = useTranslation("sidebar")
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.auth.login)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-auto w-full text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
        isCollapsed ? "justify-center px-2 py-2.5" : "justify-start gap-3 px-3 py-2.5",
        className
      )}
      onClick={handleLogout}
      aria-label={t("logout")}
      title={isCollapsed ? t("logout") : undefined}
    >
      <LogOut className="size-4 shrink-0" aria-hidden />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap motion-safe:transition-[opacity,width] motion-safe:duration-200",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}
        aria-hidden={isCollapsed}
      >
        {t("logout")}
      </span>
    </Button>
  )
}

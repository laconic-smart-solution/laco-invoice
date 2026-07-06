import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/shared/stores/auth-store"

interface SidebarLogoutButtonProps {
  className?: string
}

export function SidebarLogoutButton({ className }: SidebarLogoutButtonProps) {
  const { t } = useTranslation("sidebar")
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  if (!user) {
    return null
  }

  const handleLogout = () => {
    logout()
    navigate(ROUTES.auth.login)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-auto w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
        className
      )}
      onClick={handleLogout}
    >
      <LogOut className="size-4 shrink-0" aria-hidden />
      {t("logout")}
    </Button>
  )
}

import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UsersHeaderProps {
  className?: string
}

export function UsersHeader({ className }: UsersHeaderProps) {
  const { t } = useTranslation("users")

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link to={ROUTES.dashboard.userCreate}>
            <Plus data-icon="inline-start" />
            {t("actions.add_user")}
          </Link>
        </Button>
      </div>
    </div>
  )
}
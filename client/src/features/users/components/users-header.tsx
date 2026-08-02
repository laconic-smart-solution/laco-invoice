import { Download, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { useIsClassicEmbed } from "@/features/classic-spa/classic-embed-context"
import { cn } from "@/lib/utils"

interface UsersHeaderProps {
  className?: string
  onExportCsv?: () => void
}

export function UsersHeader({ className, onExportCsv }: UsersHeaderProps) {
  const { t } = useTranslation("users")
  const isClassic = useIsClassicEmbed()

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size={isClassic ? "sm" : "default"}
        onClick={onExportCsv}
        disabled={!onExportCsv}
      >
        <Download data-icon="inline-start" />
        {t("actions.export_csv")}
      </Button>
      <Button size={isClassic ? "sm" : "default"} asChild>
        <Link to={ROUTES.dashboard.userCreate}>
          <Plus data-icon="inline-start" />
          {t("actions.add_user")}
        </Link>
      </Button>
    </div>
  )

  if (isClassic) {
    return actions
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {actions}
    </div>
  )
}

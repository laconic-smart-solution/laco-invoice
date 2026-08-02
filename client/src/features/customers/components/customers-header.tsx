import { Download, Plus, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { useIsClassicEmbed } from "@/features/classic-spa/classic-embed-context"
import { cn } from "@/lib/utils"

interface CustomersHeaderProps {
  className?: string
  isAdmin?: boolean
  onSync?: () => void
  isSyncing?: boolean
  onExportCsv?: () => void
}

export function CustomersHeader({
  className,
  isAdmin = false,
  onSync,
  isSyncing = false,
  onExportCsv,
}: CustomersHeaderProps) {
  const { t } = useTranslation("customers")
  const isClassic = useIsClassicEmbed()

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size={isClassic ? "sm" : "default"}
        className="border-primary text-primary"
        onClick={onSync}
        disabled={isSyncing || !onSync}
      >
        <RefreshCw
          data-icon="inline-start"
          className={isSyncing ? "animate-spin" : undefined}
        />
        {t("actions.sync_customers")}
      </Button>
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
      {!isAdmin ? (
        <Button size={isClassic ? "sm" : "default"} asChild>
          <Link to={ROUTES.dashboard.customerCreate}>
            <Plus data-icon="inline-start" />
            {t("actions.add_customer")}
          </Link>
        </Button>
      ) : null}
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
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin ? t("subtitle_admin") : t("subtitle")}
        </p>
      </div>
      {actions}
    </div>
  )
}

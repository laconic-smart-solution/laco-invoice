import { Plus, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CustomersHeaderProps {
  className?: string
  isAdmin?: boolean
  onSync?: () => void
  isSyncing?: boolean
}

export function CustomersHeader({
  className,
  isAdmin = false,
  onSync,
  isSyncing = false,
}: CustomersHeaderProps) {
  const { t } = useTranslation("customers")

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

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
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
        {!isAdmin ? (
          <Button asChild>
            <Link to={ROUTES.dashboard.customerCreate}>
              <Plus data-icon="inline-start" />
              {t("actions.add_customer")}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

import { Download, RefreshCw, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

interface OrdersHeaderProps {
  onSync?: () => void
  isSyncing?: boolean
}

export function OrdersHeader({ onSync, isSyncing = false }: OrdersHeaderProps) {
  const { t } = useTranslation("orders")

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className="border-primary text-primary"
          onClick={onSync}
          disabled={isSyncing || !onSync}
        >
          <RefreshCw data-icon="inline-start" className={isSyncing ? "animate-spin" : undefined} />
          {t("actions.sync_orders")}
        </Button>
        <Button variant="outline">
          <Download data-icon="inline-start" />
          {t("actions.export_csv")}
        </Button>
        <Button>
          <Zap data-icon="inline-start" />
          {t("actions.bulk_generate")}
        </Button>
      </div>
    </div>
  )
}
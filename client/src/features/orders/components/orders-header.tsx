import { Download, RefreshCw, Upload, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useIsClassicEmbed } from "@/features/classic-spa/classic-embed-context"

interface OrdersHeaderProps {
  onSync?: () => void
  isSyncing?: boolean
  onImport?: () => void
  onExportCsv?: () => void
  isExporting?: boolean
  onBulkGenerate?: () => void
  isBulkGenerating?: boolean
}

export function OrdersHeader({
  onSync,
  isSyncing = false,
  onImport,
  onExportCsv,
  isExporting = false,
  onBulkGenerate,
  isBulkGenerating = false,
}: OrdersHeaderProps) {
  const { t } = useTranslation("orders")
  const isClassic = useIsClassicEmbed()
  const busy = isExporting || isBulkGenerating

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size={isClassic ? "sm" : "default"}
        className="border-primary text-primary"
        onClick={onSync}
        disabled={isSyncing || !onSync || busy}
      >
        <RefreshCw
          data-icon="inline-start"
          className={isSyncing ? "animate-spin" : undefined}
        />
        {t("actions.sync_orders")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size={isClassic ? "sm" : "default"}
        className="border-primary text-primary"
        onClick={onImport}
        disabled={!onImport || busy}
      >
        <Upload data-icon="inline-start" />
        {t("actions.import_excel")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size={isClassic ? "sm" : "default"}
        onClick={onExportCsv}
        disabled={busy || !onExportCsv}
        aria-busy={isExporting}
      >
        <Download data-icon="inline-start" />
        {isExporting ? t("actions.exporting") : t("actions.export_csv")}
      </Button>
      <Button
        type="button"
        size={isClassic ? "sm" : "default"}
        onClick={onBulkGenerate}
        disabled={busy || !onBulkGenerate}
        aria-busy={isBulkGenerating}
      >
        <Zap data-icon="inline-start" />
        {isBulkGenerating
          ? t("actions.bulk_generating")
          : t("actions.bulk_generate")}
      </Button>
    </div>
  )

  if (isClassic) {
    return actions
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

import { Download, FileDown } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

interface InvoicesHeaderProps {
  onExportCsv?: () => void
  onBulkDownload?: () => void
  isExporting?: boolean
  isBulkDownloading?: boolean
}

export function InvoicesHeader({
  onExportCsv,
  onBulkDownload,
  isExporting = false,
  isBulkDownloading = false,
}: InvoicesHeaderProps) {
  const { t } = useTranslation("invoices")
  const busy = isExporting || isBulkDownloading

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
          type="button"
          variant="outline"
          onClick={onExportCsv}
          disabled={busy || !onExportCsv}
          aria-busy={isExporting}
        >
          <Download data-icon="inline-start" />
          {isExporting ? t("actions.exporting") : t("actions.export_csv")}
        </Button>
        <Button
          type="button"
          onClick={onBulkDownload}
          disabled={busy || !onBulkDownload}
          aria-busy={isBulkDownloading}
        >
          <FileDown data-icon="inline-start" />
          {isBulkDownloading
            ? t("actions.bulk_downloading")
            : t("actions.bulk_download")}
        </Button>
      </div>
    </div>
  )
}

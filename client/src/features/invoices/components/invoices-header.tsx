import { Download, FileDown } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

export function InvoicesHeader() {
  const { t } = useTranslation("invoices")

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline">
          <Download data-icon="inline-start" />
          {t("actions.export_csv")}
        </Button>
        <Button>
          <FileDown data-icon="inline-start" />
          {t("actions.bulk_download")}
        </Button>
      </div>
    </div>
  )
}

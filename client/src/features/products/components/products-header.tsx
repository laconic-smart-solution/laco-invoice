import { Download } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useIsClassicEmbed } from "@/features/classic-spa/classic-embed-context"
import { cn } from "@/lib/utils"

interface ProductsHeaderProps {
  className?: string
  isSyncing?: boolean
  canSync?: boolean
  onSync?: () => void
  onExportCsv?: () => void
}

export function ProductsHeader({
  className,
  isSyncing = false,
  onExportCsv,
}: ProductsHeaderProps) {
  const { t } = useTranslation("products")
  const isClassic = useIsClassicEmbed()

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {isSyncing ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-destructive" />
          </span>
          {t("sync_status")}
        </span>
      ) : null}
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

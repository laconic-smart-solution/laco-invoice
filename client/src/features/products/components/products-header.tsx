import { Download, Filter } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProductsHeaderProps {
  className?: string
}

export function ProductsHeader({ className }: ProductsHeaderProps) {
  const { t } = useTranslation("products")

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-destructive" />
            </span>
            {t("sync_status")}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline">
          <Filter data-icon="inline-start" />
          {t("actions.filter")}
        </Button>
        <Button variant="outline">
          <Download data-icon="inline-start" />
          {t("actions.export_csv")}
        </Button>
      </div>
    </div>
  )
}

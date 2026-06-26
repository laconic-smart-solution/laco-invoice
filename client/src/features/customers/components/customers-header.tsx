import { Download, Filter } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CustomersHeaderProps {
  className?: string
}

export function CustomersHeader({ className }: CustomersHeaderProps) {
  const { t } = useTranslation("customers")

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-destructive" />
        </span>
        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          {t("sync_status")}
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline">
            <Filter data-icon="inline-start" />
            {t("actions.filter_marketplace")}
          </Button>
          <Button variant="outline">
            <Download data-icon="inline-start" />
            {t("actions.export_csv")}
          </Button>
        </div>
      </div>
    </div>
  )
}

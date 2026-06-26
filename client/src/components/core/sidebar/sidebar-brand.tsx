import { Receipt } from "lucide-react"
import { useTranslation } from "react-i18next"

export function SidebarBrand() {
  const { t } = useTranslation(["common", "sidebar"])

  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <div className="flex size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground">
        <Receipt className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate font-heading text-base font-semibold text-primary">
          {t("common:app.name")}
        </p>
        <p className="truncate text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {t("sidebar:tagline")}
        </p>
      </div>
    </div>
  )
}

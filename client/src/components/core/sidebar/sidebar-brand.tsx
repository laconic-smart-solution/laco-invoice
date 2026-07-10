import { Receipt } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

interface SidebarBrandProps {
  isCollapsed?: boolean
}

export function SidebarBrand({ isCollapsed = false }: SidebarBrandProps) {
  const { t } = useTranslation(["common", "sidebar"])

  return (
    <div
      className={cn(
        "flex items-center py-6",
        isCollapsed ? "justify-center px-2" : "gap-3 px-5"
      )}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground"
        title={isCollapsed ? t("common:app.name") : undefined}
      >
        <Receipt className="size-5" aria-hidden />
      </div>
      <div
        className={cn(
          "min-w-0 overflow-hidden motion-safe:transition-[opacity,width] motion-safe:duration-200",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}
        aria-hidden={isCollapsed}
      >
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

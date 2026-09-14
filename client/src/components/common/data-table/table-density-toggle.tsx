import { Rows3, Rows4 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  useTableDensityStore,
  type TableDensity,
} from "@/shared/stores/table-density-store"
import { cn } from "@/lib/utils"

interface TableDensityToggleProps {
  density?: TableDensity
  onDensityChange?: (density: TableDensity) => void
  className?: string
  size?: "default" | "sm" | "xs"
}

export function TableDensityToggle({
  density: propDensity,
  onDensityChange,
  className,
  size = "sm",
}: TableDensityToggleProps) {
  const { t } = useTranslation("common")
  const storeDensity = useTableDensityStore((state) => state.density)
  const setStoreDensity = useTableDensityStore((state) => state.setDensity)

  const activeDensity = propDensity ?? storeDensity

  const handleToggle = () => {
    const next = activeDensity === "compact" ? "default" : "compact"
    if (onDensityChange) {
      onDensityChange(next)
    } else {
      setStoreDensity(next)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn("h-8 gap-1.5", className)}
      onClick={handleToggle}
      title={
        activeDensity === "compact"
          ? "Switch to comfortable view"
          : "Switch to compact view"
      }
    >
      {activeDensity === "compact" ? (
        <>
          <Rows3 className="size-3.5" />
          <span>{t("table.view.comfortable", "Comfortable")}</span>
        </>
      ) : (
        <>
          <Rows4 className="size-3.5" />
          <span>{t("table.view.compact", "Compact")}</span>
        </>
      )}
    </Button>
  )
}

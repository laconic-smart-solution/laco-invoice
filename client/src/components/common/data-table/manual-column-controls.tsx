import { RotateCcw, Settings2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { TableDensityToggle } from "@/components/common/data-table/table-density-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TableDensity } from "@/shared/stores/table-density-store"
import { cn } from "@/lib/utils"

export interface ManualColumnItem {
  id: string
  label: string
  isVisible: boolean
}

interface ManualColumnControlsProps {
  columns: ManualColumnItem[]
  onToggleColumn: (id: string, isVisible: boolean) => void
  onResetColumns: () => void
  density?: TableDensity
  onDensityChange?: (density: TableDensity) => void
  showDensityToggle?: boolean
  className?: string
}

export function ManualColumnControls({
  columns,
  onToggleColumn,
  onResetColumns,
  density,
  onDensityChange,
  showDensityToggle = true,
  className,
}: ManualColumnControlsProps) {
  const { t } = useTranslation("common")

  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      {showDensityToggle && (
        <TableDensityToggle
          density={density}
          onDensityChange={onDensityChange}
        />
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        onClick={onResetColumns}
      >
        <RotateCcw className="size-3.5" />
        {t("table.view.reset_columns")}
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Settings2 className="size-3.5" />
            {t("table.view.columns")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 max-h-72 overflow-y-auto"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DropdownMenuLabel>{t("table.view.toggle_columns")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.isVisible}
              onCheckedChange={(value) => onToggleColumn(column.id, !!value)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

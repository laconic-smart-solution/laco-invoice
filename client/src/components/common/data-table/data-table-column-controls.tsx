import type { Table } from "@tanstack/react-table"
import { RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { DataTableViewOptions } from "@/components/common/data-table/data-table-view-options"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DataTableColumnControlsProps<TData> {
  table: Table<TData>
  columnLabels?: Record<string, string>
  className?: string
}

export function DataTableColumnControls<TData>({
  table,
  columnLabels,
  className,
}: DataTableColumnControlsProps<TData>) {
  const { t } = useTranslation("common")

  const handleResetColumns = () => {
    table.resetColumnVisibility()
    table.resetColumnFilters()
    table.resetSorting()
  }

  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        onClick={handleResetColumns}
      >
        <RotateCcw className="size-3.5" />
        {t("table.view.reset_columns")}
      </Button>
      <DataTableViewOptions table={table} columnLabels={columnLabels} />
    </div>
  )
}

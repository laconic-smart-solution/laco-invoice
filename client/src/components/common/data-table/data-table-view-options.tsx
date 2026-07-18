import type { Table } from "@tanstack/react-table"
import { Settings2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
  /** Optional map of column id -> display label. Falls back to column id. */
  columnLabels?: Record<string, string>
}

export function DataTableViewOptions<TData>({
  table,
  columnLabels,
}: DataTableViewOptionsProps<TData>) {
  const { t } = useTranslation("common")

  const hideableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide()
    )

  if (hideableColumns.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Settings2 className="size-3.5" />
          {t("table.view.columns")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("table.view.toggle_columns")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {columnLabels?.[column.id] ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

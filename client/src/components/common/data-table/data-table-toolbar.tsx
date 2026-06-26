import type { Table } from "@tanstack/react-table"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  selectedLabel: (count: number) => string
  bulkActionLabel?: string
  onBulkAction?: () => void
  className?: string
}

export function DataTableToolbar<TData>({
  table,
  selectedLabel,
  bulkActionLabel,
  onBulkAction,
  className,
}: DataTableToolbarProps<TData>) {
  const selectedCount = table.getSelectedRowModel().rows.length
  const hasSelection = selectedCount > 0

  let bulkAction: ReactNode = null

  if (hasSelection && bulkActionLabel) {
    bulkAction = (
      <Button
        variant="link"
        className="h-auto p-0 text-destructive"
        onClick={onBulkAction}
      >
        {bulkActionLabel}
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 text-sm",
        className
      )}
    >
      <span className="text-muted-foreground">{selectedLabel(selectedCount)}</span>
      {bulkAction}
    </div>
  )
}

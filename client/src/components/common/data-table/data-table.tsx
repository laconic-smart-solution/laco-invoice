import {
  flexRender,
  type Row,
  type Table,
} from "@tanstack/react-table"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { DEFAULT_LIMIT } from "@/shared/hooks/use-pagination"

const SKELETON_WIDTHS = ["w-24", "w-32", "w-20", "w-28", "w-16"] as const

export interface DataTableProps<TData> {
  table: Table<TData>
  emptyMessage?: string
  className?: string
  onRowClick?: (row: TData) => void
  isLoading?: boolean
  /** Number of skeleton rows to render while loading. Prefer the current page size (`limit`). */
  skeletonRowCount?: number
}

export function DataTable<TData>({
  table,
  emptyMessage,
  className,
  onRowClick,
  isLoading = false,
  skeletonRowCount = DEFAULT_LIMIT,
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows
  const headerGroups = table.getHeaderGroups()
  const columnCount = Math.max(table.getVisibleLeafColumns().length, 1)
  const resolvedSkeletonRowCount = Math.max(1, skeletonRowCount)

  if (!isLoading && rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        {emptyMessage ?? "No results."}
      </div>
    )
  }

  const handleRowClick = (row: Row<TData>) => {
    if (!onRowClick) {
      return
    }

    onRowClick(row.original)
  }

  return (
    <UiTable className={className}>
      <TableHeader>
        {headerGroups.map((headerGroup) => (
          <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className="h-11 bg-muted/40 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: resolvedSkeletonRowCount }, (_, rowIndex) => (
              <TableRow
                key={`skeleton-row-${rowIndex}`}
                className="border-b border-border/80 hover:bg-transparent"
              >
                {Array.from({ length: columnCount }, (_, columnIndex) => (
                  <TableCell key={`skeleton-cell-${rowIndex}-${columnIndex}`} className="px-4 py-3.5">
                    <Skeleton
                      className={cn(
                        "h-4",
                        SKELETON_WIDTHS[(rowIndex + columnIndex) % SKELETON_WIDTHS.length]
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "border-b border-border/80",
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                data-state={row.getIsSelected() ? "selected" : undefined}
                onClick={() => handleRowClick(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3.5 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </UiTable>
  )
}

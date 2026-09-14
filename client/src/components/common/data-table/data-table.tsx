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

import {
  useTableDensityStore,
  type TableDensity,
} from "@/shared/stores/table-density-store"

export interface DataTableProps<TData> {
  table: Table<TData>
  emptyMessage?: string
  className?: string
  onRowClick?: (row: TData) => void
  isLoading?: boolean
  /** Number of skeleton rows to render while loading. Prefer the current page size (`limit`). */
  skeletonRowCount?: number
  density?: TableDensity
}

export function DataTable<TData>({
  table,
  emptyMessage,
  className,
  onRowClick,
  isLoading = false,
  skeletonRowCount = DEFAULT_LIMIT,
  density: propDensity,
}: DataTableProps<TData>) {
  const storeDensity = useTableDensityStore((state) => state.density)
  const resolvedDensity = propDensity ?? storeDensity
  const isCompact = resolvedDensity === "compact"
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
                className={cn(
                  "bg-muted/40 font-medium tracking-normal text-muted-foreground uppercase select-none",
                  isCompact
                    ? "h-8.5 px-2.5 py-1 text-[11px] whitespace-nowrap"
                    : "h-11 px-4 text-xs tracking-wide",
                  header.id === "select" && (isCompact ? "w-9 px-2 text-center" : "w-12 px-3"),
                  header.id === "action" && (isCompact ? "w-10 px-1 text-center" : "w-16")
                )}
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
                  <TableCell
                    key={`skeleton-cell-${rowIndex}-${columnIndex}`}
                    className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3.5")}
                  >
                    <Skeleton
                      className={cn(
                        isCompact ? "h-3.5" : "h-4",
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
                  <TableCell
                    key={cell.id}
                    className={cn(
                      isCompact ? "px-2.5 py-1.5 text-xs" : "px-4 py-3.5 text-sm",
                      cell.column.id === "select" && (isCompact ? "w-9 px-2 text-center" : "w-12 px-3"),
                      cell.column.id === "action" && (isCompact ? "w-10 px-1 text-center" : "w-16")
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </UiTable>
  )
}

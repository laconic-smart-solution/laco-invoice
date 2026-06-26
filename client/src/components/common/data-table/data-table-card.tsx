import type { LucideIcon } from "lucide-react"
import type { Table } from "@tanstack/react-table"
import type { ReactNode } from "react"

import { DataTable } from "@/components/common/data-table/data-table"
import { cn } from "@/lib/utils"

interface DataTableCardProps<TData> {
  title: string
  icon?: LucideIcon
  headerAction?: ReactNode
  table: Table<TData>
  emptyMessage?: string
  className?: string
  tableClassName?: string
  toolbar?: ReactNode
}

export function DataTableCard<TData>({
  title,
  icon: Icon,
  headerAction,
  table,
  emptyMessage,
  className,
  tableClassName,
  toolbar,
}: DataTableCardProps<TData>) {
  return (
    <section
      className={cn("border border-border bg-card shadow-sm", className)}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
          <h2 className="truncate font-heading text-sm font-semibold">{title}</h2>
        </div>
        {headerAction}
      </div>

      {toolbar}

      <div className={cn("overflow-x-auto", tableClassName)}>
        <DataTable table={table} emptyMessage={emptyMessage} />
      </div>
    </section>
  )
}

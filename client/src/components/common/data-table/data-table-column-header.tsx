import type { Column } from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  EyeOff,
  Search,
} from "lucide-react"
import type { HTMLAttributes } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DataTableColumnHeaderProps<TData, TValue>
  extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
  enableSearch?: boolean
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  enableSearch = true,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useTranslation("common")

  const canSort = column.getCanSort()
  const canHide = column.getCanHide()
  const canFilter = enableSearch && column.getCanFilter()

  if (!canSort && !canHide && !canFilter) {
    return <div className={cn(className)}>{title}</div>
  }

  const filterValue = (column.getFilterValue() as string | undefined) ?? ""
  const sorted = column.getIsSorted()

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 gap-1.5 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
          >
            <span>{title}</span>
            {sorted === "desc" ? (
              <ArrowDown className="size-3.5" />
            ) : sorted === "asc" ? (
              <ArrowUp className="size-3.5" />
            ) : (
              <ChevronsUpDown className="size-3.5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {canFilter ? (
            <>
              <div
                className="px-2 py-1.5"
                onKeyDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filterValue}
                    onChange={(event) =>
                      column.setFilterValue(event.target.value || undefined)
                    }
                    placeholder={t("table.column.search_placeholder")}
                    className="h-8 pl-7"
                    aria-label={t("table.column.search_aria", { column: title })}
                  />
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          ) : null}

          {canSort ? (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="size-3.5 text-muted-foreground" />
                {t("table.column.sort_asc")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="size-3.5 text-muted-foreground" />
                {t("table.column.sort_desc")}
              </DropdownMenuItem>
              {canHide ? <DropdownMenuSeparator /> : null}
            </>
          ) : null}

          {canHide ? (
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="size-3.5 text-muted-foreground" />
              {t("table.column.hide")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

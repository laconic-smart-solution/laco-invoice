import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import type { Store } from "@/features/stores/types/store"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatDateTime } from "@/util/format"

interface StoresTableProps {
  stores: Store[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  start: number
  end: number
  canGoPrev: boolean
  canGoNext: boolean
  isLoading?: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export function StoresTable({
  stores,
  totalCount,
  page,
  limit,
  totalPages,
  start,
  end,
  canGoPrev,
  canGoNext,
  isLoading = false,
  onPageChange,
  onLimitChange,
}: StoresTableProps) {
  const { t } = useTranslation("stores")
  const locale = useLocaleStore((state) => state.locale)

  const columns = useMemo<ColumnDef<Store>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("table.columns.name"),
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <p className="font-medium text-foreground">{row.original.name}</p>
          </div>
        ),
      },
      {
        accessorKey: "active",
        header: t("table.columns.status"),
        cell: ({ getValue }) => {
          const active = getValue<boolean>()
          return (
            <Badge variant={active ? "secondary" : "destructive"}>
              {active ? t("table.status.active") : t("table.status.inactive")}
            </Badge>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: t("table.columns.created_at"),
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDateTime(getValue<string>(), locale)}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
        cell: ({ row }) => (
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.dashboard.storeDetail(row.original.id)}>
              {t("table.actions.view")}
            </Link>
          </Button>
        ),
      },
    ],
    [locale, t]
  )

  const table = useDataTable({
    data: stores,
    columns,
    getRowId: (row) => String(row.id),
  })

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            {t("table.loading")}
          </div>
        ) : (
          <DataTable table={table} emptyMessage={t("table.empty")} />
        )}
      </div>

      <DataTableFooter
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        start={start}
        end={end}
        limit={limit}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        showingLabel={(rangeStart, rangeEnd, total) =>
          t("table.showing", { start: rangeStart, end: rangeEnd, total })
        }
      />
    </section>
  )
}

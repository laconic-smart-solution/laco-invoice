import type { ColumnDef } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import type { Customer } from "@/features/customers/types/customer"

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function formatGenderLabel(
  gender: Customer["gender"],
  t: (key: string) => string
): string {
  if (gender === "male" || gender === "female") {
    return t(`table.gender.${gender}`)
  }
  return gender?.trim() ? gender : "—"
}

interface CustomersTableProps {
  customers: Customer[]
  isAdmin?: boolean
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

export function CustomersTable({
  customers,
  isAdmin = false,
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
}: CustomersTableProps) {
  const { t } = useTranslation("customers")
  const navigate = useNavigate()

  const handleRowClick = useCallback(
    (customer: Customer) => {
      navigate(ROUTES.dashboard.customerEdit(String(customer.id)))
    },
    [navigate]
  )

  const columns = useMemo<ColumnDef<Customer>[]>(() => {
    const baseColumns: ColumnDef<Customer>[] = [
      {
        accessorKey: "id",
        header: t("table.columns.id"),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue<number>()}
          </span>
        ),
      },
    ]

    if (isAdmin) {
      baseColumns.push({
        accessorKey: "storeId",
        header: t("table.columns.store"),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue<number | null>() ?? "—"}
          </span>
        ),
      })
    }

    baseColumns.push(
      {
        accessorKey: "name",
        header: t("table.columns.customer_name"),
        cell: ({ row }) => {
          const customer = row.original

          return (
            <div className="flex min-w-[200px] items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(customer.name)}
              </div>
              <p className="font-medium text-foreground">{customer.name}</p>
            </div>
          )
        },
      },
      {
        accessorKey: "email",
        header: t("table.columns.email"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string | null>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: t("table.columns.phone"),
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "gender",
        header: t("table.columns.gender"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {formatGenderLabel(getValue<Customer["gender"]>(), t)}
          </span>
        ),
      },
      {
        accessorKey: "address",
        header: t("table.columns.address"),
        cell: ({ getValue }) => (
          <span className="min-w-[200px] text-muted-foreground">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      }
    )

    return baseColumns
  }, [isAdmin, t])

  const table = useDataTable({
    data: customers,
    columns,
  })

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <DataTable
          table={table}
          emptyMessage={t("table.empty")}
          isLoading={isLoading}
          skeletonRowCount={limit}
          onRowClick={handleRowClick}
        />
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

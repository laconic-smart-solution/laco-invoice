import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import { CustomerBadge } from "@/features/customers/components/customer-badge"
import { ACTIVE_MARKETPLACE_FILTERS } from "@/features/customers/data/mock-customers"
import type { Customer, CustomerBadgeTier } from "@/features/customers/types/customer"

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

const BADGE_TIER_LABEL_KEY: Record<CustomerBadgeTier, string> = {
  premium: "table.badges.premium",
  top_buyer: "table.badges.top_buyer",
  new_customer: "table.badges.new_customer",
}

interface CustomersTableProps {
  customers: Customer[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  start: number
  end: number
  canGoPrev: boolean
  canGoNext: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export function CustomersTable({
  customers,
  totalCount,
  page,
  limit,
  totalPages,
  start,
  end,
  canGoPrev,
  canGoNext,
  onPageChange,
  onLimitChange,
}: CustomersTableProps) {
  const { t } = useTranslation("customers")

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("table.columns.id"),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue<string>()}
          </span>
        ),
      },
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
              <div className="space-y-1">
                <p className="font-medium text-foreground">{customer.name}</p>
                {customer.badge ? (
                  <CustomerBadge
                    tier={customer.badge}
                    label={t(BADGE_TIER_LABEL_KEY[customer.badge])}
                  />
                ) : null}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "email",
        header: t("table.columns.email"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: t("table.columns.phone"),
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "gender",
        header: t("table.columns.gender"),
        cell: ({ getValue }) => (
          <span className="capitalize text-muted-foreground">
            {t(`table.gender.${getValue<Customer["gender"]>()}`)}
          </span>
        ),
      },
      {
        accessorKey: "address",
        header: t("table.columns.address"),
        cell: ({ getValue }) => (
          <span className="min-w-[200px] text-muted-foreground">
            {getValue<string>()}
          </span>
        ),
      },
    ],
    [t]
  )

  const table = useDataTable({
    data: customers,
    columns,
  })

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        {ACTIVE_MARKETPLACE_FILTERS.map((filter) => (
          <span
            key={filter}
            className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {t(`table.filters.${filter}`)}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <DataTable table={table} emptyMessage={t("table.empty")} />
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

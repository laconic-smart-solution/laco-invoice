import type { ColumnDef } from "@tanstack/react-table"
import { Pencil } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"

import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import type { ProductErpStatus, ProductTableRow } from "@/features/products/types/product"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency } from "@/util/format"

const ERP_STATUS_BADGE: Record<ProductErpStatus, StatusBadgeVariant> = {
  synced: "synced",
  unmapped: "unmapped",
}

interface ProductRowActionProps {
  product: ProductTableRow
}

function ProductRowAction({ product }: ProductRowActionProps) {
  const { t } = useTranslation("products")

  if (product.erpStatus === "unmapped") {
    return (
      <Button
        size="sm"
        onClick={(event) => event.stopPropagation()}
      >
        {t("table.actions.map_to_erp")}
      </Button>
    )
  }

  return (
    <Button
      variant="link"
      className="h-auto gap-1.5 p-0 text-info"
      asChild
      onClick={(event) => event.stopPropagation()}
    >
      <Link to={ROUTES.dashboard.productDetail(product.id)}>
        {t("table.actions.view_details")}
        <Pencil className="size-3.5" aria-hidden />
      </Link>
    </Button>
  )
}

interface ProductsTableProps {
  products: ProductTableRow[]
  isLoading?: boolean
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

export function ProductsTable({
  products,
  isLoading = false,
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
}: ProductsTableProps) {
  const { t } = useTranslation("products")
  const locale = useLocaleStore((state) => state.locale)

  const columns = useMemo<ColumnDef<ProductTableRow>[]>(
    () => [
      {
        id: "store_marketplace",
        header: t("table.columns.store_marketplace"),
        cell: ({ row }) => (
          <div className="min-w-[160px] space-y-0.5">
            <p className="text-sm text-foreground">{row.original.storeName}</p>
            <p className="text-xs text-muted-foreground">{row.original.marketplaceName}</p>
          </div>
        ),
      },
      {
        id: "product_sku",
        header: t("table.columns.product_sku"),
        cell: ({ row }) => (
          <div className="min-w-[180px] space-y-1.5">
            <p className="text-sm text-foreground">
              {t("table.id_label", { id: row.original.externalProductId })}
            </p>
            {row.original.sku ? (
              <span className="inline-flex rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {row.original.sku}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: t("table.columns.name"),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "price",
        header: t("table.columns.price"),
        cell: ({ row }) => {
          const amount = Number.parseFloat(row.original.price)
          const currency = row.original.currency || "USD"
          if (!Number.isFinite(amount)) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <span className="font-medium text-foreground">
              {formatCurrency(amount, locale, currency)}
            </span>
          )
        },
      },
      {
        accessorKey: "erpStatus",
        header: t("table.columns.erp_status"),
        cell: ({ getValue }) => {
          const status = getValue<ProductErpStatus>()
          return (
            <StatusBadge
              status={ERP_STATUS_BADGE[status]}
              label={t(`erp_status.${status}`).toUpperCase()}
              showDot
            />
          )
        },
      },
      {
        id: "action",
        header: t("table.columns.action"),
        cell: ({ row }) => <ProductRowAction product={row.original} />,
      },
    ],
    [locale, t]
  )

  const table = useDataTable({
    data: products,
    columns,
    getRowId: (row) => String(row.id),
  })

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <DataTable
          table={table}
          emptyMessage={isLoading ? t("table.loading") : t("table.empty")}
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

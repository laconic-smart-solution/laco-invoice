import type { ColumnDef } from "@tanstack/react-table"
import { Download, Store } from "lucide-react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import type { InvoiceListItem, InvoiceStatus } from "@/features/invoices/types/invoice"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatDateTime } from "@/util/format"

const INVOICE_STATUS_BADGE: Record<InvoiceStatus, StatusBadgeVariant> = {
  paid: "paid",
  pending: "pending",
  overdue: "overdue",
  draft: "draft",
}

interface InvoiceRowActionProps {
  invoice: InvoiceListItem
}

function InvoiceRowAction({ invoice }: InvoiceRowActionProps) {
  const { t } = useTranslation("invoices")

  return (
    <div
      className="flex items-center gap-2"
      onClick={(event) => event.stopPropagation()}
    >
      {invoice.pdfUrl ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("table.actions.download")}
        >
          <Download />
        </Button>
      ) : null}
      <Button variant="link" className="h-auto p-0 text-info" asChild>
        <Link to={ROUTES.dashboard.orderDetail(invoice.orderId)}>
          {t("table.actions.view_order")}
        </Link>
      </Button>
    </div>
  )
}

interface InvoicesTableProps {
  invoices: InvoiceListItem[]
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

export function InvoicesTable({
  invoices,
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
}: InvoicesTableProps) {
  const { t } = useTranslation("invoices")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)

  const handleRowClick = useCallback(
    (invoice: InvoiceListItem) => {
      void navigate(ROUTES.dashboard.invoiceDetail(invoice.id))
    },
    [navigate]
  )

  const columns = useMemo<ColumnDef<InvoiceListItem>[]>(
    () => [
      {
        accessorKey: "invoiceNo",
        header: t("table.columns.invoice_no"),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "externalOrderId",
        header: t("table.columns.order_id"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "customerName",
        header: t("table.columns.customer"),
      },
      {
        accessorKey: "storeName",
        header: t("table.columns.store"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center bg-foreground text-background">
              <Store className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm">{row.original.storeName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.marketplaceName}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "grandTotal",
        header: t("table.columns.grand_total"),
        cell: ({ getValue }) => formatCurrency(getValue<number>(), locale),
      },
      {
        accessorKey: "status",
        header: t("table.columns.status"),
        cell: ({ getValue }) => {
          const status = getValue<InvoiceStatus>()
          return (
            <StatusBadge
              status={INVOICE_STATUS_BADGE[status]}
              label={t(`status.${status}`).toUpperCase()}
              showDot
            />
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: t("table.columns.created_at"),
        cell: ({ getValue }) => formatDateTime(getValue<string>(), locale),
      },
      {
        id: "action",
        header: t("table.columns.action"),
        cell: ({ row }) => <InvoiceRowAction invoice={row.original} />,
      },
    ],
    [locale, t]
  )

  const table = useDataTable({
    data: invoices,
    columns,
    getRowId: (row) => row.id,
  })

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <DataTable
          table={table}
          emptyMessage={t("table.empty")}
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

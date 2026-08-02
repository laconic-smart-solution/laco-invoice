import type { ColumnDef } from "@tanstack/react-table"
import { Download, Store } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnControls } from "@/components/common/data-table/data-table-column-controls"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { DataTableRowActions } from "@/components/common/data-table/data-table-row-actions"
import { DataTableToolbar } from "@/components/common/data-table/data-table-toolbar"
import type { DataTableSelection } from "@/components/common/data-table/types"
import {
  useDataTable,
  type RowSelectionState,
} from "@/components/common/data-table/use-data-table"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { InvoiceListItem, InvoiceStatus } from "@/features/invoices/types/invoice"
import { useDownloadInvoicePdfMutation } from "@/shared/queries/invoice.query"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatDateTime } from "@/util/format"

const INVOICE_STATUS_BADGE: Record<InvoiceStatus, StatusBadgeVariant> = {
  ISSUED: "paid",
  VOID: "draft",
}

interface InvoiceRowActionProps {
  invoice: InvoiceListItem
}

function InvoiceRowAction({ invoice }: InvoiceRowActionProps) {
  const { t } = useTranslation("invoices")
  const downloadMutation = useDownloadInvoicePdfMutation()
  const numericId = Number.parseInt(invoice.id, 10)

  return (
    <DataTableRowActions>
      <DropdownMenuItem
        disabled={!Number.isFinite(numericId) || downloadMutation.isPending}
        onSelect={() => {
          if (!Number.isFinite(numericId)) {
            return
          }
          downloadMutation.mutate({
            id: numericId,
            filename: `${invoice.invoiceNo}.pdf`,
          })
        }}
      >
        <Download aria-hidden />
        {t("table.actions.download")}
      </DropdownMenuItem>
      {invoice.orderId ? (
        <DropdownMenuItem asChild>
          <Link to={ROUTES.dashboard.orderDetail(invoice.orderId)}>
            {t("table.actions.view_order")}
          </Link>
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  )
}

interface InvoicesTableProps {
  invoices: InvoiceListItem[]
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
  onSelectionChange?: (selection: DataTableSelection) => void
}

export function InvoicesTable({
  invoices,
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
  onSelectionChange,
}: InvoicesTableProps) {
  const { t } = useTranslation("invoices")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false)

  const pageRowIdsKey = useMemo(
    () => invoices.map((invoice) => invoice.id).join(","),
    [invoices]
  )

  useEffect(() => {
    setRowSelection({})
    setIsAllMatchingSelected(false)
  }, [totalCount])

  useEffect(() => {
    if (!isAllMatchingSelected || invoices.length === 0) {
      return
    }
    const next: RowSelectionState = {}
    for (const invoice of invoices) {
      next[invoice.id] = true
    }
    setRowSelection(next)
  }, [invoices, isAllMatchingSelected, pageRowIdsKey])

  const handleRowClick = useCallback(
    (invoice: InvoiceListItem) => {
      void navigate(ROUTES.dashboard.invoiceDetail(invoice.id))
    },
    [navigate]
  )

  const columnLabels = useMemo(
    () => ({
      invoiceNo: t("table.columns.invoice_no"),
      customerName: t("table.columns.customer"),
      storeName: t("table.columns.store"),
      grandTotal: t("table.columns.grand_total"),
      status: t("table.columns.status"),
      issuedAt: t("table.columns.created_at"),
    }),
    [t]
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
                {row.original.marketplaceCode}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "grandTotal",
        header: t("table.columns.grand_total"),
        cell: ({ row }) =>
          formatCurrency(
            row.original.grandTotal,
            locale,
            row.original.currency
          ),
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
        accessorKey: "issuedAt",
        header: t("table.columns.created_at"),
        cell: ({ getValue }) => {
          const value = getValue<string | null>()
          return value ? formatDateTime(value, locale) : "—"
        },
      },
      {
        id: "action",
        header: t("table.columns.action"),
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        cell: ({ row }) => <InvoiceRowAction invoice={row.original} />,
      },
    ],
    [locale, t]
  )

  const table = useDataTable({
    data: invoices,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    selectColumnLabels: {
      selectAll: t("table.select_all"),
      selectRow: t("table.select_row"),
    },
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    meta: {
      selectAllMatching: {
        enabled: true,
        isSelected: isAllMatchingSelected,
        onChange: setIsAllMatchingSelected,
      },
    },
  })

  useEffect(() => {
    if (!onSelectionChange) {
      return
    }
    const ids = Object.keys(rowSelection).filter((id) => rowSelection[id])
    const pageRowCount = invoices.length
    onSelectionChange({
      ids,
      isAllPageSelected: pageRowCount > 0 && ids.length === pageRowCount,
      isAllMatchingSelected,
    })
  }, [invoices.length, isAllMatchingSelected, onSelectionChange, rowSelection])

  const toolbarSelectedCount = isAllMatchingSelected
    ? totalCount
    : Object.keys(rowSelection).filter((id) => rowSelection[id]).length

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <DataTableToolbar
          table={table}
          selectedCount={toolbarSelectedCount}
          selectedLabel={(count) => t("table.selected_count", { count })}
          className="border-b-0"
        />
        <DataTableColumnControls
          table={table}
          columnLabels={columnLabels}
          className="px-4 py-3"
        />
      </div>

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

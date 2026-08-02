import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import { Store } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnControls } from "@/components/common/data-table/data-table-column-controls"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import { ExportPreviewDialog } from "@/components/common/export-preview-dialog"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import type { InvoiceListItem, InvoiceStatus } from "@/features/invoices/types/invoice"
import { useInfiniteScrollSentinel } from "@/shared/hooks/use-infinite-scroll-sentinel"
import {
  getInvoiceErrorMessage,
  useExportInvoicesMutation,
  useInvoiceExportPreviewQuery,
} from "@/shared/queries/invoice.query"
import type { InvoiceExportRequest } from "@/shared/services/invoice.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatDateTime } from "@/util/format"

const INVOICE_STATUS_BADGE: Record<InvoiceStatus, StatusBadgeVariant> = {
  ISSUED: "paid",
  VOID: "draft",
}

const DEFAULT_VISIBLE_COLUMNS = [
  "invoiceNo",
  "orderId",
  "storeName",
  "marketplaceCode",
  "customerName",
  "grandTotal",
  "currency",
  "vatPercentage",
  "status",
  "issuedAt",
] as const

interface InvoiceExportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scope: Omit<InvoiceExportRequest, "pageNumber" | "pageSize" | "columns">
}

export function InvoiceExportPreviewDialog({
  open,
  onOpenChange,
  scope,
}: InvoiceExportPreviewDialogProps) {
  const { t } = useTranslation("invoices")
  const locale = useLocaleStore((state) => state.locale)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [exportError, setExportError] = useState<string | null>(null)
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)

  const previewQuery = useInvoiceExportPreviewQuery(scope, open)
  const exportMutation = useExportInvoicesMutation()

  useEffect(() => {
    if (open) {
      setColumnVisibility({})
      setExportError(null)
    }
  }, [open])

  const rows = useMemo(
    () => previewQuery.data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [previewQuery.data?.pages]
  )
  const totalCount = previewQuery.data?.pages[0]?.meta?.totalElements ?? 0

  const columnLabels = useMemo(
    () => ({
      invoiceNo: t("table.columns.invoice_no"),
      orderId: t("table.columns.order_id"),
      storeName: t("table.columns.store"),
      marketplaceCode: t("export.columns.marketplace"),
      customerName: t("table.columns.customer"),
      grandTotal: t("table.columns.grand_total"),
      currency: t("export.columns.currency"),
      vatPercentage: t("export.columns.vat"),
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
        accessorKey: "orderId",
        header: t("table.columns.order_id"),
      },
      {
        accessorKey: "storeName",
        header: t("table.columns.store"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center bg-foreground text-background">
              <Store className="size-3.5" aria-hidden />
            </span>
            <span className="truncate text-sm">{row.original.storeName}</span>
          </div>
        ),
      },
      {
        accessorKey: "marketplaceCode",
        header: t("export.columns.marketplace"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "customerName",
        header: t("table.columns.customer"),
      },
      {
        accessorKey: "grandTotal",
        header: t("table.columns.grand_total"),
        cell: ({ row }) =>
          formatCurrency(row.original.grandTotal, locale, row.original.currency),
      },
      {
        accessorKey: "currency",
        header: t("export.columns.currency"),
      },
      {
        accessorKey: "vatPercentage",
        header: t("export.columns.vat"),
        cell: ({ getValue }) => `${getValue<number>()}%`,
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
    ],
    [locale, t]
  )

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  })

  const loadMore = useCallback(() => {
    if (previewQuery.hasNextPage && !previewQuery.isFetchingNextPage) {
      void previewQuery.fetchNextPage()
    }
  }, [previewQuery])

  const sentinelRef = useInfiniteScrollSentinel({
    enabled: open && Boolean(previewQuery.hasNextPage),
    onIntersect: loadMore,
    root: scrollRoot,
  })

  const visibleColumns = table
    .getVisibleLeafColumns()
    .map((column) => column.id)
    .filter((id) => DEFAULT_VISIBLE_COLUMNS.includes(id as (typeof DEFAULT_VISIBLE_COLUMNS)[number]))

  const handleExport = async () => {
    setExportError(null)
    try {
      await exportMutation.mutateAsync({
        ...scope,
        columns: visibleColumns.length > 0 ? visibleColumns : [...DEFAULT_VISIBLE_COLUMNS],
      })
      onOpenChange(false)
    } catch (error) {
      setExportError(getInvoiceErrorMessage(error, t("errors.export_failed")))
    }
  }

  const loadError =
    previewQuery.isError && previewQuery.error
      ? getInvoiceErrorMessage(previewQuery.error, t("errors.export_preview_failed"))
      : null

  return (
    <ExportPreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("export.preview_title")}
      description={t("export.preview_description")}
      totalCount={totalCount}
      columnControls={
        <DataTableColumnControls table={table} columnLabels={columnLabels} />
      }
      onConfirmExport={handleExport}
      isExporting={exportMutation.isPending}
      canExport={rows.length > 0 && !previewQuery.isLoading}
      exportError={exportError ?? loadError}
    >
      <div
        ref={setScrollRoot}
        className="h-full max-h-[min(50vh,28rem)] overflow-y-auto"
      >
        <div className="overflow-x-auto px-1">
          <DataTable
            table={table}
            emptyMessage={
              previewQuery.isLoading
                ? t("export.preview_loading")
                : t("export.preview_empty")
            }
            isLoading={previewQuery.isLoading && rows.length === 0}
            skeletonRowCount={10}
          />
          <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
          {previewQuery.isFetchingNextPage ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              {t("export.preview_loading_more")}
            </p>
          ) : null}
          {!previewQuery.hasNextPage && rows.length > 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              {t("export.preview_end")}
            </p>
          ) : null}
        </div>
      </div>
    </ExportPreviewDialog>
  )
}

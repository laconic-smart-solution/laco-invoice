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
import type { OrderSourceType } from "@/features/orders/types/order"
import { useInfiniteScrollSentinel } from "@/shared/hooks/use-infinite-scroll-sentinel"
import {
  getOrderErrorMessage,
  useExportOrdersMutation,
  useOrderExportPreviewQuery,
} from "@/shared/queries/order.query"
import type {
  ApiOrderDto,
  ApiOrderStatus,
  OrderExportRequest,
} from "@/shared/services/order.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatDate, formatDateTime } from "@/util/format"

const ORDER_STATUS_BADGE: Record<ApiOrderStatus, StatusBadgeVariant> = {
  PENDING: "pending",
  CONFIRMED: "synced",
  SHIPPED: "synced",
  DELIVERED: "synced",
  CANCELLED: "failed",
}

const SOURCE_TYPE_BADGE: Record<OrderSourceType, StatusBadgeVariant> = {
  API: "synced",
  IMPORT: "draft",
}

const DEFAULT_VISIBLE_COLUMNS = [
  "id",
  "externalOrderId",
  "storeName",
  "marketplaceCode",
  "customerName",
  "customerPhone",
  "invoiceId",
  "orderStatus",
  "sourceType",
  "subtotal",
  "shippingFee",
  "amountExVat",
  "vatAmount",
  "totalAmount",
  "currency",
  "orderDate",
  "createdAt",
] as const

interface OrderExportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scope: Omit<OrderExportRequest, "pageNumber" | "pageSize" | "columns">
}

export function OrderExportPreviewDialog({
  open,
  onOpenChange,
  scope,
}: OrderExportPreviewDialogProps) {
  const { t } = useTranslation("orders")
  const locale = useLocaleStore((state) => state.locale)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [exportError, setExportError] = useState<string | null>(null)
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)

  const previewQuery = useOrderExportPreviewQuery(scope, open)
  const exportMutation = useExportOrdersMutation()

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
      id: t("export.columns.id"),
      externalOrderId: t("table.columns.order_id"),
      storeName: t("table.columns.store"),
      marketplaceCode: t("export.columns.marketplace"),
      customerName: t("table.columns.customer"),
      customerPhone: t("export.columns.customer_phone"),
      invoiceId: t("export.columns.invoice_id"),
      orderStatus: t("table.columns.sync_status"),
      sourceType: t("table.columns.source"),
      subtotal: t("export.columns.subtotal"),
      shippingFee: t("export.columns.shipping"),
      amountExVat: t("export.columns.ex_vat"),
      vatAmount: t("export.columns.vat"),
      totalAmount: t("table.columns.total_amount"),
      currency: t("export.columns.currency"),
      orderDate: t("table.columns.order_date"),
      createdAt: t("export.columns.created_at"),
    }),
    [t]
  )

  const columns = useMemo<ColumnDef<ApiOrderDto>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("export.columns.id"),
      },
      {
        accessorKey: "externalOrderId",
        header: t("table.columns.order_id"),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "storeName",
        header: t("table.columns.store"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center bg-foreground text-background">
              <Store className="size-3.5" aria-hidden />
            </span>
            <span>{row.original.storeName}</span>
          </div>
        ),
      },
      {
        accessorKey: "marketplaceCode",
        header: t("export.columns.marketplace"),
      },
      {
        accessorKey: "customerName",
        header: t("table.columns.customer"),
      },
      {
        accessorKey: "customerPhone",
        header: t("export.columns.customer_phone"),
      },
      {
        accessorKey: "invoiceId",
        header: t("export.columns.invoice_id"),
        cell: ({ getValue }) => getValue<number | null>() ?? "—",
      },
      {
        accessorKey: "orderStatus",
        header: t("table.columns.sync_status"),
        cell: ({ getValue }) => {
          const status = getValue<ApiOrderStatus>()
          return (
            <StatusBadge
              status={ORDER_STATUS_BADGE[status]}
              label={status}
              showDot
            />
          )
        },
      },
      {
        accessorKey: "sourceType",
        header: t("table.columns.source"),
        cell: ({ getValue }) => {
          const sourceType = (getValue<string>() === "IMPORT" ? "IMPORT" : "API") as OrderSourceType
          return (
            <StatusBadge
              status={SOURCE_TYPE_BADGE[sourceType]}
              label={t(`source_type.${sourceType === "IMPORT" ? "import" : "api"}`).toUpperCase()}
            />
          )
        },
      },
      {
        accessorKey: "subtotal",
        header: t("export.columns.subtotal"),
        cell: ({ row }) =>
          formatCurrency(row.original.subtotal, locale, row.original.currency || "THB"),
      },
      {
        accessorKey: "shippingFee",
        header: t("export.columns.shipping"),
        cell: ({ row }) =>
          formatCurrency(row.original.shippingFee, locale, row.original.currency || "THB"),
      },
      {
        accessorKey: "amountExVat",
        header: t("export.columns.ex_vat"),
        cell: ({ row }) =>
          formatCurrency(row.original.amountExVat ?? 0, locale, row.original.currency || "THB"),
      },
      {
        accessorKey: "vatAmount",
        header: t("export.columns.vat"),
        cell: ({ row }) =>
          formatCurrency(row.original.vatAmount ?? 0, locale, row.original.currency || "THB"),
      },
      {
        accessorKey: "totalAmount",
        header: t("table.columns.total_amount"),
        cell: ({ row }) =>
          formatCurrency(row.original.totalAmount, locale, row.original.currency || "THB"),
      },
      {
        accessorKey: "currency",
        header: t("export.columns.currency"),
      },
      {
        accessorKey: "orderDate",
        header: t("table.columns.order_date"),
        cell: ({ getValue }) => {
          const value = getValue<string | null>()
          return value ? formatDate(value, locale) : "—"
        },
      },
      {
        accessorKey: "createdAt",
        header: t("export.columns.created_at"),
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
    getRowId: (row) => String(row.id),
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
    .filter((id) =>
      DEFAULT_VISIBLE_COLUMNS.includes(id as (typeof DEFAULT_VISIBLE_COLUMNS)[number])
    )

  const handleExport = async () => {
    setExportError(null)
    try {
      await exportMutation.mutateAsync({
        ...scope,
        columns: visibleColumns.length > 0 ? visibleColumns : [...DEFAULT_VISIBLE_COLUMNS],
      })
      onOpenChange(false)
    } catch (error) {
      setExportError(getOrderErrorMessage(error, t("errors.export_failed")))
    }
  }

  const loadError =
    previewQuery.isError && previewQuery.error
      ? getOrderErrorMessage(previewQuery.error, t("errors.export_preview_failed"))
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

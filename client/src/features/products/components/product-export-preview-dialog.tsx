import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnControls } from "@/components/common/data-table/data-table-column-controls"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import { ExportPreviewDialog } from "@/components/common/export-preview-dialog"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import type {
  MarketplaceProduct,
  ProductErpStatus,
} from "@/features/products/types/product"
import { useInfiniteScrollSentinel } from "@/shared/hooks/use-infinite-scroll-sentinel"
import {
  getMarketplaceProductErrorMessage,
  useExportMarketplaceProductsMutation,
  useMarketplaceProductExportPreviewQuery,
} from "@/shared/queries/marketplace-product.query"
import type { MarketplaceProductExportRequest } from "@/shared/services/marketplace-product.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency } from "@/util/format"

const ERP_STATUS_BADGE: Record<ProductErpStatus, StatusBadgeVariant> = {
  synced: "synced",
  unmapped: "unmapped",
}

const DEFAULT_VISIBLE_COLUMNS = [
  "id",
  "storeName",
  "marketplaceCode",
  "marketplaceName",
  "externalProductId",
  "sku",
  "name",
  "price",
  "currency",
  "status",
  "erpStatus",
] as const

interface ProductExportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scope: Omit<MarketplaceProductExportRequest, "pageNumber" | "pageSize" | "columns">
}

export function ProductExportPreviewDialog({
  open,
  onOpenChange,
  scope,
}: ProductExportPreviewDialogProps) {
  const { t } = useTranslation("products")
  const locale = useLocaleStore((state) => state.locale)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [exportError, setExportError] = useState<string | null>(null)
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)

  const previewQuery = useMarketplaceProductExportPreviewQuery(scope, open)
  const exportMutation = useExportMarketplaceProductsMutation()

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
      storeName: t("export.columns.store"),
      marketplaceCode: t("export.columns.marketplace_code"),
      marketplaceName: t("export.columns.marketplace_name"),
      externalProductId: t("export.columns.external_product_id"),
      sku: t("export.columns.sku"),
      name: t("table.columns.name"),
      price: t("table.columns.price"),
      currency: t("export.columns.currency"),
      status: t("export.columns.status"),
      erpStatus: t("table.columns.erp_status"),
    }),
    [t]
  )

  const columns = useMemo<ColumnDef<MarketplaceProduct>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("export.columns.id"),
      },
      {
        accessorKey: "storeName",
        header: t("export.columns.store"),
      },
      {
        accessorKey: "marketplaceCode",
        header: t("export.columns.marketplace_code"),
      },
      {
        accessorKey: "marketplaceName",
        header: t("export.columns.marketplace_name"),
      },
      {
        accessorKey: "externalProductId",
        header: t("export.columns.external_product_id"),
      },
      {
        accessorKey: "sku",
        header: t("export.columns.sku"),
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
          const price = Number.parseFloat(row.original.price)
          if (!Number.isFinite(price)) {
            return row.original.price || "—"
          }
          return formatCurrency(price, locale, row.original.currency || "THB")
        },
      },
      {
        accessorKey: "currency",
        header: t("export.columns.currency"),
      },
      {
        accessorKey: "status",
        header: t("export.columns.status"),
        cell: ({ getValue }) => getValue<string>() || t("status.unknown"),
      },
      {
        accessorKey: "erpStatus",
        header: t("table.columns.erp_status"),
        cell: ({ getValue }) => {
          const status = getValue<ProductErpStatus>()
          return (
            <StatusBadge
              status={ERP_STATUS_BADGE[status]}
              label={t(`erp_status.${status}`)}
              showDot
            />
          )
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
      setExportError(
        getMarketplaceProductErrorMessage(error, t("errors.export_failed"))
      )
    }
  }

  const loadError =
    previewQuery.isError && previewQuery.error
      ? getMarketplaceProductErrorMessage(
          previewQuery.error,
          t("errors.export_preview_failed")
        )
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

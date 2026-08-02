import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnControls } from "@/components/common/data-table/data-table-column-controls"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import { ExportPreviewDialog } from "@/components/common/export-preview-dialog"
import type { Customer } from "@/features/customers/types/customer"
import { useInfiniteScrollSentinel } from "@/shared/hooks/use-infinite-scroll-sentinel"
import {
  getCustomerErrorMessage,
  useCustomerExportPreviewQuery,
  useExportCustomersMutation,
} from "@/shared/queries/customer.query"
import type { CustomerExportRequest } from "@/shared/services/customer.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatDateTime } from "@/util/format"

const DEFAULT_VISIBLE_COLUMNS = [
  "id",
  "storeName",
  "marketplaceCode",
  "externalCustomerId",
  "name",
  "email",
  "phone",
  "gender",
  "address",
  "createdAt",
] as const

interface CustomerExportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scope: Omit<CustomerExportRequest, "pageNumber" | "pageSize" | "columns">
}

export function CustomerExportPreviewDialog({
  open,
  onOpenChange,
  scope,
}: CustomerExportPreviewDialogProps) {
  const { t } = useTranslation("customers")
  const locale = useLocaleStore((state) => state.locale)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [exportError, setExportError] = useState<string | null>(null)
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)

  const previewQuery = useCustomerExportPreviewQuery(scope, open)
  const exportMutation = useExportCustomersMutation()

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
      id: t("table.columns.id"),
      storeName: t("table.columns.store"),
      marketplaceCode: t("export.columns.marketplace"),
      externalCustomerId: t("export.columns.external_customer_id"),
      name: t("table.columns.customer_name"),
      email: t("table.columns.email"),
      phone: t("table.columns.phone"),
      gender: t("table.columns.gender"),
      address: t("table.columns.address"),
      createdAt: t("export.columns.created_at"),
    }),
    [t]
  )

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("table.columns.id"),
      },
      {
        accessorKey: "storeName",
        header: t("table.columns.store"),
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "marketplaceCode",
        header: t("export.columns.marketplace"),
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "externalCustomerId",
        header: t("export.columns.external_customer_id"),
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "name",
        header: t("table.columns.customer_name"),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "email",
        header: t("table.columns.email"),
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "phone",
        header: t("table.columns.phone"),
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "gender",
        header: t("table.columns.gender"),
        cell: ({ getValue }) => {
          const gender = getValue<Customer["gender"]>()
          if (gender === "male" || gender === "female") {
            return t(`table.gender.${gender}`)
          }
          return gender?.trim() ? gender : "—"
        },
      },
      {
        accessorKey: "address",
        header: t("table.columns.address"),
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
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
      setExportError(getCustomerErrorMessage(error, t("errors.export_failed")))
    }
  }

  const loadError =
    previewQuery.isError && previewQuery.error
      ? getCustomerErrorMessage(previewQuery.error, t("errors.export_preview_failed"))
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

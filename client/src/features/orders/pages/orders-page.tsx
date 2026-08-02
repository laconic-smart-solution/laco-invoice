import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EMPTY_TABLE_SELECTION } from "@/components/common/data-table/types"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { useIsClassicEmbed } from "@/features/classic-spa/classic-embed-context"
import { useClassicWorkspaceStore } from "@/shared/stores/classic-workspace-store"
import { OrderExportPreviewDialog } from "@/features/orders/components/order-export-preview-dialog"
import { OrderImportDialog } from "@/features/orders/components/order-import-dialog"
import { OrdersFilters } from "@/features/orders/components/orders-filters"
import { OrdersHeader } from "@/features/orders/components/orders-header"
import { OrdersStatCards } from "@/features/orders/components/orders-stat-cards"
import { OrdersTable } from "@/features/orders/components/orders-table"
import {
  DEFAULT_ORDER_FILTERS,
  type OrderFiltersState,
} from "@/features/orders/types/order-filters"
import { mapOrderDtoToOrder } from "@/features/orders/util/map-order"
import type {
  ApiOrderSourceType,
  ApiOrderStatus,
  OrderExportRequest,
} from "@/shared/services/order.service"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { useExportSelection } from "@/shared/hooks/use-export-selection"
import { getPaginationMeta, usePagination } from "@/shared/hooks/use-pagination"
import { useRegisterListShortcuts } from "@/shared/hooks/use-register-list-shortcuts"
import {
  getOrderErrorMessage,
  useOrderStatsQuery,
  useOrdersPageQuery,
  useStartBulkGenerateOrdersMutation,
  useTriggerOrderSyncMutation,
} from "@/shared/queries/order.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import {
  selectIsBulkGenerateRunning,
  useOrderBulkGenerateStore,
} from "@/shared/stores/order-bulk-generate-store"
import { getColumnFilterValue } from "@/util/table-column-filters"
import { sortingToPageSort } from "@/util/table-sort"

const ORDER_SORT_FIELD_MAP: Record<string, string> = {
  orderId: "externalOrderId",
  orderDate: "orderDate",
  storeName: "store.name",
  customer: "customer.name",
  totalAmount: "totalAmount",
}

const STORES_LIST_REQUEST = {
  pageNumber: 1,
  pageSize: 500,
  sortBy: "name",
  sortOrder: "ASC" as const,
}

export function OrdersPage() {
  const { t } = useTranslation("orders")
  const isClassic = useIsClassicEmbed()
  const awaitingInvoiceFocus = useClassicWorkspaceStore(
    (state) => state.panelFilter.ordersAwaitingInvoice === true
  )
  const clearPanelFilter = useClassicWorkspaceStore(
    (state) => state.clearPanelFilter
  )
  const { page, limit, setPage, setLimit } = usePagination()
  const [filters, setFilters] = useState<OrderFiltersState>(DEFAULT_ORDER_FILTERS)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false)
  const [exportScope, setExportScope] = useState<
    Omit<OrderExportRequest, "pageNumber" | "pageSize" | "columns">
  >({ exportAll: false })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const debouncedColumnFilters = useDebounce(columnFilters)

  const startBulkRun = useOrderBulkGenerateStore((state) => state.startRun)
  const isBulkRunActive = useOrderBulkGenerateStore(selectIsBulkGenerateRunning)

  const { data: storesResponse, isLoading: storesLoading } =
    useStoresPageQuery(STORES_LIST_REQUEST)
  const stores = Array.isArray(storesResponse?.data) ? storesResponse.data : []

  const pageSort = useMemo(
    () => sortingToPageSort(sorting, ORDER_SORT_FIELD_MAP),
    [sorting]
  )
  const columnOrderId = useMemo(
    () => getColumnFilterValue(debouncedColumnFilters, "orderId"),
    [debouncedColumnFilters]
  )

  const exportFilter = useMemo(() => {
    const filter: OrderExportRequest["filter"] = {}

    if (filters.storeId) {
      const storeId = Number(filters.storeId)
      if (Number.isFinite(storeId) && storeId > 0) {
        filter.storeId = storeId
      }
    }

    if (filters.orderStatus !== "all") {
      filter.orderStatus = filters.orderStatus as ApiOrderStatus
    }

    if (filters.sourceType !== "all") {
      filter.sourceType = filters.sourceType as ApiOrderSourceType
    }

    const orderSearch = columnOrderId || filters.search.trim()
    if (orderSearch) {
      filter.externalOrderId = orderSearch
    }

    return Object.keys(filter).length > 0 ? filter : undefined
  }, [
    columnOrderId,
    filters.orderStatus,
    filters.search,
    filters.sourceType,
    filters.storeId,
  ])

  const pageRequest = useMemo(() => {
    return {
      pageNumber: page,
      pageSize: limit,
      ...pageSort,
      ...(exportFilter ? { filter: exportFilter } : {}),
    }
  }, [exportFilter, limit, page, pageSort])

  const { data, isLoading, isError, error } = useOrdersPageQuery(pageRequest)
  const syncMutation = useTriggerOrderSyncMutation()
  const startBulkGenerateMutation = useStartBulkGenerateOrdersMutation()

  const isBulkGenerating =
    startBulkGenerateMutation.isPending || isBulkRunActive

  const statsStoreId = useMemo(() => {
    if (!filters.storeId) {
      return undefined
    }
    const parsed = Number(filters.storeId)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [filters.storeId])

  const { data: stats } = useOrderStatsQuery(statsStoreId)

  const orders = useMemo(
    () => (data?.data ?? []).map(mapOrderDtoToOrder),
    [data?.data]
  )
  const totalCount = data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const {
    setSelection,
    confirmAction,
    closeConfirm,
    requestAction,
    actionError,
    setActionError,
  } = useExportSelection({ totalCount })

  const loadError =
    isError && error
      ? getOrderErrorMessage(error, t("errors.load_failed"))
      : null

  const syncError =
    syncMutation.isError && syncMutation.error
      ? getOrderErrorMessage(syncMutation.error, t("errors.sync_failed"))
      : null

  const handleFiltersChange = (next: OrderFiltersState) => {
    setFilters(next)
    setPage(1)
  }

  const openExportPreview = useCallback(
    (scope: Omit<OrderExportRequest, "pageNumber" | "pageSize" | "columns">) => {
      setExportScope(scope)
      setExportPreviewOpen(true)
    },
    []
  )

  const runBulkGenerate = useCallback(
    async (request: OrderExportRequest) => {
      try {
        const run = await startBulkGenerateMutation.mutateAsync(request)
        if (run?.id) {
          startBulkRun(run)
        }
      } catch (err) {
        setActionError(
          getOrderErrorMessage(err, t("errors.bulk_generate_failed"))
        )
        throw err
      }
    },
    [setActionError, startBulkGenerateMutation, startBulkRun, t]
  )

  const handleExportCsv = useCallback(() => {
    const result = requestAction("export")
    if (result.kind === "need_selection") {
      setActionError(t("errors.select_to_export"))
      return
    }
    if (result.kind === "confirm_all") {
      openExportPreview({
        exportAll: true,
        filter: exportFilter,
      })
      closeConfirm()
      return
    }
    if (result.kind === "selected") {
      openExportPreview({
        ids: result.ids.map((id) => Number(id)).filter(Number.isFinite),
      })
    }
  }, [
    closeConfirm,
    exportFilter,
    openExportPreview,
    requestAction,
    setActionError,
    t,
  ])

  const handleClearSelection = useCallback(() => {
    setSelection(EMPTY_TABLE_SELECTION)
  }, [setSelection])

  useRegisterListShortcuts({
    onExport: handleExportCsv,
    onClearSelection: handleClearSelection,
  })

  const handleBulkGenerate = () => {
    const result = requestAction("bulk")
    if (result.kind === "need_selection") {
      setActionError(t("errors.select_to_bulk_generate"))
      return
    }
    if (result.kind === "selected") {
      void runBulkGenerate({
        ids: result.ids.map((id) => Number(id)).filter(Number.isFinite),
      })
    }
  }

  const handleConfirmBulkAll = async () => {
    await runBulkGenerate({
      exportAll: true,
      filter: exportFilter,
    })
  }

  return (
    <div className="space-y-6 p-6">
      <OrdersHeader
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
        onImport={() => setIsImportOpen(true)}
        onExportCsv={handleExportCsv}
        onBulkGenerate={handleBulkGenerate}
        isBulkGenerating={isBulkGenerating}
      />
      <OrderExportPreviewDialog
        open={exportPreviewOpen}
        onOpenChange={setExportPreviewOpen}
        scope={exportScope}
      />
      <OrderImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        stores={stores}
        defaultStoreId={filters.storeId}
      />
      <ConfirmDialog
        open={confirmAction === "bulk"}
        onOpenChange={(open) => {
          if (!open && !isBulkGenerating) {
            closeConfirm()
          }
        }}
        title={t("confirm.bulk_generate_all.title")}
        description={t("confirm.bulk_generate_all.description", {
          count: totalCount,
        })}
        confirmLabel={t("confirm.bulk_generate_all.confirm")}
        cancelLabel={t("confirm.export_all.cancel")}
        onConfirm={handleConfirmBulkAll}
        isLoading={isBulkGenerating}
      />
      <AuthFormError message={syncError} />
      <OrdersFilters
        stores={stores}
        value={filters}
        onChange={handleFiltersChange}
        disabled={storesLoading}
      />
      {isClassic && awaitingInvoiceFocus ? (
        <div className="flex items-center justify-between gap-2 border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span>
            {t("stats.awaiting_invoice")}:{" "}
            {stats?.awaitingInvoice ?? 0}
          </span>
          <button
            type="button"
            className="font-medium text-foreground underline-offset-2 hover:underline"
            onClick={() => clearPanelFilter()}
          >
            {t("filters.status_all")}
          </button>
        </div>
      ) : null}
      <OrdersStatCards
        stats={
          stats ?? {
            totalOrders: 0,
            invoicedOrders: 0,
            awaitingInvoice: 0,
            invoiceCoveragePercent: 0,
          }
        }
      />
      <AuthFormError message={loadError ?? actionError} />
      <OrdersTable
        orders={orders}
        totalCount={totalCount}
        page={page}
        limit={limit}
        totalPages={totalPages}
        start={start}
        end={end}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        isLoading={isLoading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        sorting={sorting}
        onSortingChange={(next) => {
          setSorting(next)
          setPage(1)
        }}
        columnFilters={columnFilters}
        onColumnFiltersChange={(next) => {
          setColumnFilters(next)
          setPage(1)
        }}
        onSelectionChange={setSelection}
        onBulkGenerate={handleBulkGenerate}
        isBulkGenerating={isBulkGenerating}
      />
    </div>
  )
}

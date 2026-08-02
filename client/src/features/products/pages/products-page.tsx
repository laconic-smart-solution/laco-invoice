import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"

import { ROUTES } from "@/app/constants/routes"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { ProductExportPreviewDialog } from "@/features/products/components/product-export-preview-dialog"
import { ProductsFilters } from "@/features/products/components/products-filters"
import { ProductsHeader } from "@/features/products/components/products-header"
import { ProductsStatCards } from "@/features/products/components/products-stat-cards"
import { ProductsTable } from "@/features/products/components/products-table"
import type { ProductFiltersState } from "@/features/products/types/product"
import { Button } from "@/components/ui/button"
import { DEFAULT_LIMIT, DEFAULT_PAGE, getPaginationMeta } from "@/shared/hooks/use-pagination"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { useExportSelection } from "@/shared/hooks/use-export-selection"
import {
  marketplaceProductKeys,
  useMarketplaceProductSourcesQuery,
  useMarketplaceProductStatsQuery,
  useMarketplaceProductSyncStatusQuery,
  useMarketplaceProductsPageQuery,
  useStartMarketplaceProductSyncMutation,
} from "@/shared/queries/marketplace-product.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import type { MarketplaceProductExportRequest } from "@/shared/services/marketplace-product.service"
import { useMarketplaceProductSyncSubscription } from "@/shared/hooks/use-marketplace-product-sync-subscription"
import { getFirstColumnFilterValue } from "@/util/table-column-filters"
import { sortingToPageSort } from "@/util/table-sort"

const DEFAULT_FILTERS: ProductFiltersState = {
  storeId: "",
  search: "",
  erpStatus: "all",
  priceMin: "",
  priceMax: "",
}

const STORES_LIST_REQUEST = {
  pageNumber: 1,
  pageSize: 500,
  sortBy: "name",
  sortOrder: "ASC" as const,
}

const PRODUCT_SORT_FIELD_MAP: Record<string, string> = {
  name: "name",
  price: "price",
  product_sku: "sku",
  store_marketplace: "name",
  erpStatus: "updatedAt",
}

export function ProductsPage() {
  const { t } = useTranslation("products")
  const queryClient = useQueryClient()
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_FILTERS)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const debouncedColumnFilters = useDebounce(columnFilters)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [activeSyncRunId, setActiveSyncRunId] = useState<number | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false)
  const [exportScope, setExportScope] = useState<
    Omit<MarketplaceProductExportRequest, "pageNumber" | "pageSize" | "columns">
  >({ exportAll: false })

  const {
    data: storesResponse,
    isLoading: storesLoading,
    error: storesError,
  } = useStoresPageQuery(STORES_LIST_REQUEST)
  const stores = Array.isArray(storesResponse?.data) ? storesResponse.data : []

  const { data: sources = [], error: sourcesError } = useMarketplaceProductSourcesQuery()

  const isAllStores = !filters.storeId
  const selectedStoreId = filters.storeId
    ? Number(filters.storeId)
    : null

  const storeSources = useMemo(() => {
    if (selectedStoreId == null || !Number.isFinite(selectedStoreId)) {
      return []
    }
    return sources.filter((source) => source.storeId === selectedStoreId)
  }, [selectedStoreId, sources])

  const syncTarget = storeSources[0] ?? null

  const priceMin = filters.priceMin ? Number.parseFloat(filters.priceMin) : undefined
  const priceMax = filters.priceMax ? Number.parseFloat(filters.priceMax) : undefined
  const resolvedPriceMin = Number.isFinite(priceMin) ? priceMin : undefined
  const resolvedPriceMax = Number.isFinite(priceMax) ? priceMax : undefined
  const pageSort = useMemo(
    () => sortingToPageSort(sorting, PRODUCT_SORT_FIELD_MAP),
    [sorting]
  )
  const columnSearch = useMemo(
    () =>
      getFirstColumnFilterValue(debouncedColumnFilters, [
        "name",
        "product_sku",
        "store_marketplace",
      ]),
    [debouncedColumnFilters]
  )
  const resolvedSearch = columnSearch || filters.search.trim()

  const pageRequest = useMemo(() => {
    const filter: NonNullable<MarketplaceProductExportRequest["filter"]> = {}

    if (selectedStoreId != null && Number.isFinite(selectedStoreId) && selectedStoreId > 0) {
      filter.storeId = selectedStoreId
    }
    if (resolvedSearch) {
      filter.search = resolvedSearch
    }
    if (filters.erpStatus !== "all") {
      filter.erpStatus = filters.erpStatus
    }
    if (resolvedPriceMin != null) {
      filter.priceMin = resolvedPriceMin
    }
    if (resolvedPriceMax != null) {
      filter.priceMax = resolvedPriceMax
    }

    return {
      pageNumber: page,
      pageSize: limit,
      ...pageSort,
      ...(Object.keys(filter).length > 0 ? { filter } : {}),
    }
  }, [
    filters.erpStatus,
    limit,
    page,
    pageSort,
    resolvedPriceMax,
    resolvedPriceMin,
    resolvedSearch,
    selectedStoreId,
  ])

  const exportFilter = pageRequest.filter

  const {
    data: productPage,
    isLoading: productsLoading,
    error: productsError,
  } = useMarketplaceProductsPageQuery(pageRequest, !storesLoading)

  const statsParams = useMemo(
    () =>
      selectedStoreId != null && Number.isFinite(selectedStoreId) && selectedStoreId > 0
        ? { storeId: selectedStoreId }
        : {},
    [selectedStoreId]
  )

  const { data: stats } = useMarketplaceProductStatsQuery(statsParams, !storesLoading)

  const startSyncMutation = useStartMarketplaceProductSyncMutation()

  const { usePollingFallback } = useMarketplaceProductSyncSubscription(activeSyncRunId, {
    enabled: activeSyncRunId != null,
  })

  const { data: syncRun } = useMarketplaceProductSyncStatusQuery(
    activeSyncRunId,
    activeSyncRunId != null,
    { pollingEnabled: usePollingFallback }
  )

  const isSyncRunning =
    startSyncMutation.isPending ||
    syncRun?.status === "RUNNING" ||
    storeSources.some((source) => source.syncStatus === "RUNNING")

  useEffect(() => {
    if (!syncRun) {
      return
    }
    if (syncRun.status === "COMPLETED") {
      setSyncMessage(t("sync.completed"))
      setActiveSyncRunId(null)
      void queryClient.invalidateQueries({ queryKey: marketplaceProductKeys.all })
    } else if (syncRun.status === "FAILED") {
      setSyncMessage(syncRun.errorMessage ?? t("sync.failed"))
      setActiveSyncRunId(null)
    }
  }, [queryClient, syncRun, t])

  const handleSync = useCallback(async () => {
    if (!syncTarget || isSyncRunning) {
      return
    }
    setSyncMessage(null)
    try {
      const run = await startSyncMutation.mutateAsync({
        storeId: syncTarget.storeId,
        marketplaceCode: syncTarget.marketplaceCode,
      })
      if (run?.id) {
        setActiveSyncRunId(run.id)
      }
    } catch {
      setSyncMessage(t("sync.start_failed"))
    }
  }, [isSyncRunning, startSyncMutation, syncTarget, t])

  const products = productPage?.data ?? []
  const totalCount = productPage?.meta?.totalElements ?? 0
  const pagination = getPaginationMeta(page, limit, totalCount)

  const {
    setSelection,
    closeConfirm,
    requestAction,
    actionError,
    setActionError,
  } = useExportSelection({ totalCount })

  const openExportPreview = useCallback(
    (
      scope: Omit<
        MarketplaceProductExportRequest,
        "pageNumber" | "pageSize" | "columns"
      >
    ) => {
      setExportScope(scope)
      setExportPreviewOpen(true)
    },
    []
  )

  const handleExportCsv = () => {
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
  }

  useEffect(() => {
    setPage(1)
  }, [
    filters.storeId,
    filters.search,
    filters.erpStatus,
    filters.priceMin,
    filters.priceMax,
    debouncedColumnFilters,
  ])

  const requestError =
    storesError != null
      ? t("errors.load_sources_failed")
      : sourcesError != null
        ? t("errors.load_sources_failed")
        : productsError != null
          ? t("errors.load_products_failed")
          : null

  const showEmptyStores = !storesLoading && stores.length === 0
  const showNeverSynced =
    !isAllStores &&
    !storesLoading &&
    !productsLoading &&
    syncTarget != null &&
    syncTarget.syncStatus == null &&
    totalCount === 0

  return (
    <div className="space-y-6 p-6">
      <ProductsHeader
        isSyncing={isSyncRunning}
        canSync={syncTarget != null && !showEmptyStores}
        isFiltersOpen={isFiltersOpen}
        onSync={() => void handleSync()}
        onToggleFilters={() => setIsFiltersOpen((open) => !open)}
        onExportCsv={handleExportCsv}
      />
      <ProductExportPreviewDialog
        open={exportPreviewOpen}
        onOpenChange={setExportPreviewOpen}
        scope={exportScope}
      />
      <AuthFormError message={requestError ?? syncMessage ?? actionError} />

      {showEmptyStores ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("empty.no_connections")}</p>
          <Button asChild className="mt-4">
            <Link to={ROUTES.dashboard.stores}>{t("empty.go_to_stores")}</Link>
          </Button>
        </div>
      ) : showNeverSynced ? (
        <>
          <ProductsFilters
            stores={stores}
            value={filters}
            onChange={(next) => {
              setFilters(next)
              setPage(1)
            }}
            disabled={storesLoading}
          />
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">{t("empty.never_synced")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("empty.sync_now_prompt")}</p>
            <Button className="mt-4" onClick={() => void handleSync()} disabled={isSyncRunning}>
              {t("actions.sync_now")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <ProductsStatCards
            stats={
              stats ?? {
                mappingRatePercent: 0,
                actionRequiredCount: 0,
                activeSkuCount: 0,
              }
            }
          />
          <ProductsFilters
            stores={stores}
            value={filters}
            onChange={(next) => {
              setFilters(next)
              setPage(1)
            }}
            showAdvanced={isFiltersOpen}
            disabled={storesLoading}
          />
          <ProductsTable
            products={products}
            isLoading={storesLoading || productsLoading}
            totalCount={totalCount}
            page={pagination.page}
            limit={pagination.limit}
            totalPages={pagination.totalPages}
            start={pagination.start}
            end={pagination.end}
            canGoPrev={pagination.canGoPrev}
            canGoNext={pagination.canGoNext}
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit)
              setPage(1)
            }}
            sorting={sorting}
            onSortingChange={(next) => {
              setSorting(next)
              setPage(1)
            }}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            onSelectionChange={setSelection}
          />
        </>
      )}
    </div>
  )
}

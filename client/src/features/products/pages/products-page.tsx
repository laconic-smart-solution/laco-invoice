import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"

import { ROUTES } from "@/app/constants/routes"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { ProductsFilters } from "@/features/products/components/products-filters"
import { ProductsHeader } from "@/features/products/components/products-header"
import { ProductsStatCards } from "@/features/products/components/products-stat-cards"
import { ProductsTable } from "@/features/products/components/products-table"
import type { ProductFiltersState } from "@/features/products/types/product"
import { Button } from "@/components/ui/button"
import { DEFAULT_LIMIT, DEFAULT_PAGE, getPaginationMeta } from "@/shared/hooks/use-pagination"
import { useDebounce } from "@/shared/hooks/use-debounce"
import {
  marketplaceProductKeys,
  useMarketplaceProductSourcesQuery,
  useMarketplaceProductStatsQuery,
  useMarketplaceProductSyncStatusQuery,
  useMarketplaceProductsPageQuery,
  useStartMarketplaceProductSyncMutation,
} from "@/shared/queries/marketplace-product.query"
import {
  parseProductSourceKey,
} from "@/shared/services/marketplace-product.service"
import { useMarketplaceProductSyncSubscription } from "@/shared/hooks/use-marketplace-product-sync-subscription"
import { getFirstColumnFilterValue } from "@/util/table-column-filters"
import { sortingToPageSort } from "@/util/table-sort"

const DEFAULT_FILTERS: ProductFiltersState = {
  sourceKey: "",
  search: "",
  erpStatus: "all",
  priceMin: "",
  priceMax: "",
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

  const {
    data: sources = [],
    isLoading: sourcesLoading,
    error: sourcesError,
  } = useMarketplaceProductSourcesQuery()

  const isAllSources = !filters.sourceKey
  const selectedSourceKey = filters.sourceKey || "all"

  const activeSource = useMemo(
    () =>
      sources.find((source) => {
        const key = `${source.storeId}:${source.marketplaceCode}`
        return key === filters.sourceKey
      }) ?? null,
    [filters.sourceKey, sources]
  )

  const parsedSource = useMemo(
    () => (filters.sourceKey ? parseProductSourceKey(filters.sourceKey) : null),
    [filters.sourceKey]
  )

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
    const filter: NonNullable<
      import("@/shared/services/marketplace-product.service").MarketplaceProductPageRequest["filter"]
    > = {}

    if (parsedSource) {
      filter.storeId = parsedSource.storeId
      filter.marketplaceCode = parsedSource.marketplaceCode
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
    parsedSource,
    resolvedPriceMax,
    resolvedPriceMin,
    resolvedSearch,
  ])

  const {
    data: productPage,
    isLoading: productsLoading,
    error: productsError,
  } = useMarketplaceProductsPageQuery(pageRequest, sources.length > 0)

  const statsParams = useMemo(
    () =>
      parsedSource
        ? {
            storeId: parsedSource.storeId,
            marketplaceCode: parsedSource.marketplaceCode,
          }
        : {},
    [parsedSource]
  )

  const { data: stats } = useMarketplaceProductStatsQuery(
    statsParams,
    sources.length > 0
  )

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
    activeSource?.syncStatus === "RUNNING"

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
    if (!parsedSource || isSyncRunning) {
      return
    }
    setSyncMessage(null)
    try {
      const run = await startSyncMutation.mutateAsync({
        storeId: parsedSource.storeId,
        marketplaceCode: parsedSource.marketplaceCode,
      })
      if (run?.id) {
        setActiveSyncRunId(run.id)
      }
    } catch {
      setSyncMessage(t("sync.start_failed"))
    }
  }, [isSyncRunning, parsedSource, startSyncMutation, t])

  const products = productPage?.data ?? []
  const totalCount = productPage?.meta?.totalElements ?? 0
  const pagination = getPaginationMeta(page, limit, totalCount)

  useEffect(() => {
    setPage(1)
  }, [
    filters.sourceKey,
    filters.search,
    filters.erpStatus,
    filters.priceMin,
    filters.priceMax,
    debouncedColumnFilters,
  ])

  const requestError =
    sourcesError != null
      ? t("errors.load_sources_failed")
      : productsError != null
        ? t("errors.load_products_failed")
        : null

  const showEmptyConnections = !sourcesLoading && sources.length === 0
  const showNeverSynced =
    !isAllSources &&
    !sourcesLoading &&
    !productsLoading &&
    activeSource != null &&
    activeSource.syncStatus == null &&
    totalCount === 0

  return (
    <div className="space-y-6 p-6">
      <ProductsHeader
        isSyncing={isSyncRunning}
        canSync={parsedSource != null && !showEmptyConnections}
        isFiltersOpen={isFiltersOpen}
        onSync={() => void handleSync()}
        onToggleFilters={() => setIsFiltersOpen((open) => !open)}
      />
      <AuthFormError message={requestError ?? syncMessage} />

      {showEmptyConnections ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("empty.no_connections")}</p>
          <Button asChild className="mt-4">
            <Link to={ROUTES.dashboard.stores}>{t("empty.go_to_stores")}</Link>
          </Button>
        </div>
      ) : showNeverSynced ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("empty.never_synced")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("empty.sync_now_prompt")}</p>
          <Button className="mt-4" onClick={() => void handleSync()} disabled={isSyncRunning}>
            {t("actions.sync_now")}
          </Button>
        </div>
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
          {isFiltersOpen ? (
            <ProductsFilters
              sources={sources}
              value={filters}
              selectedSourceKey={selectedSourceKey}
              onChange={(next) => {
                setFilters(next)
                setPage(1)
              }}
              disabled={sourcesLoading}
            />
          ) : null}
          <ProductsTable
            products={products}
            isLoading={sourcesLoading || productsLoading}
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
          />
        </>
      )}
    </div>
  )
}

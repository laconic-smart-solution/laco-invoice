import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"

import { ROUTES } from "@/app/constants/routes"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { ProductsFilters } from "@/features/products/components/products-filters"
import { ProductsHeader } from "@/features/products/components/products-header"
import { ProductsStatCards } from "@/features/products/components/products-stat-cards"
import { ProductsTable } from "@/features/products/components/products-table"
import type { ProductFiltersState, ProductStats } from "@/features/products/types/product"
import { Button } from "@/components/ui/button"
import { DEFAULT_LIMIT, DEFAULT_PAGE, getPaginationMeta } from "@/shared/hooks/use-pagination"
import {
  marketplaceProductKeys,
  useMarketplaceProductSourcesQuery,
  useMarketplaceProductSyncStatusQuery,
  useMarketplaceProductsAcrossSourcesQuery,
  useMarketplaceProductsQuery,
  useStartMarketplaceProductSyncMutation,
} from "@/shared/queries/marketplace-product.query"
import {
  buildProductSourceKey,
  parseProductSourceKey,
} from "@/shared/services/marketplace-product.service"
import { useMarketplaceProductSyncSubscription } from "@/shared/hooks/use-marketplace-product-sync-subscription"

const DEFAULT_FILTERS: ProductFiltersState = {
  sourceKey: "",
  search: "",
  erpStatus: "all",
  priceMin: "",
  priceMax: "",
  priceSort: "none",
}

function parseProductPrice(price: string): number {
  const parsed = Number.parseFloat(price)
  return Number.isFinite(parsed) ? parsed : 0
}

export function ProductsPage() {
  const { t } = useTranslation("products")
  const queryClient = useQueryClient()
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_FILTERS)
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
      sources.find(
        (source) =>
          buildProductSourceKey(source.storeId, source.marketplaceCode) ===
          filters.sourceKey
      ) ?? null,
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

  const {
    data: productResult,
    isLoading: productsLoading,
    error: productsError,
  } = useMarketplaceProductsQuery(
    parsedSource
      ? {
          storeId: parsedSource.storeId,
          marketplaceCode: parsedSource.marketplaceCode,
          page,
          limit,
          priceMin: resolvedPriceMin,
          priceMax: resolvedPriceMax,
        }
      : null,
    !isAllSources && sources.length > 0
  )

  const {
    data: allProductsResult,
    isLoading: allProductsLoading,
    error: allProductsError,
  } = useMarketplaceProductsAcrossSourcesQuery(
    sources,
    {
      priceMin: resolvedPriceMin,
      priceMax: resolvedPriceMax,
    },
    isAllSources && sources.length > 0
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

  const products = isAllSources
    ? (allProductsResult?.items ?? [])
    : (productResult?.items ?? [])

  const filteredProducts = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase()

    let next = products

    if (searchTerm) {
      next = next.filter((product) => {
        const haystack = [
          product.name,
          product.sku,
          product.externalProductId,
          product.storeName,
          product.marketplaceName,
        ]
          .join(" ")
          .toLowerCase()
        return haystack.includes(searchTerm)
      })
    }

    if (filters.erpStatus !== "all") {
      next = next.filter((product) => product.erpStatus === filters.erpStatus)
    }

    if (filters.priceSort === "asc" || filters.priceSort === "desc") {
      const direction = filters.priceSort === "asc" ? 1 : -1
      next = [...next].sort(
        (a, b) =>
          (parseProductPrice(a.price) - parseProductPrice(b.price)) * direction
      )
    }

    return next
  }, [filters.erpStatus, filters.priceSort, filters.search, products])

  const hasClientFilters =
    filters.search.trim().length > 0 ||
    filters.erpStatus !== "all" ||
    filters.priceSort !== "none"

  const pagedProducts = useMemo(() => {
    if (!isAllSources) {
      return filteredProducts
    }
    const startIndex = (page - 1) * limit
    return filteredProducts.slice(startIndex, startIndex + limit)
  }, [filteredProducts, isAllSources, limit, page])

  const totalCount =
    isAllSources || hasClientFilters
      ? filteredProducts.length
      : (productResult?.total ?? 0)
  const pagination = getPaginationMeta(page, limit, totalCount)

  useEffect(() => {
    setPage(1)
  }, [
    filters.sourceKey,
    filters.search,
    filters.erpStatus,
    filters.priceMin,
    filters.priceMax,
    filters.priceSort,
  ])

  const stats: ProductStats = useMemo(() => {
    const syncedCount = products.filter((product) => product.erpStatus === "synced").length
    const unmappedCount = products.filter((product) => product.erpStatus === "unmapped").length
    const totalOnPage = products.length

    return {
      mappingRatePercent: totalOnPage > 0 ? (syncedCount / totalOnPage) * 100 : 0,
      actionRequiredCount: unmappedCount,
      activeSkuCount: syncedCount,
    }
  }, [products])

  const isProductsLoading = isAllSources ? allProductsLoading : productsLoading
  const productsRequestError = isAllSources ? allProductsError : productsError

  const requestError =
    sourcesError != null
      ? t("errors.load_sources_failed")
      : productsRequestError != null
        ? t("errors.load_products_failed")
        : null

  const showEmptyConnections = !sourcesLoading && sources.length === 0
  const showNeverSynced =
    !isAllSources &&
    !sourcesLoading &&
    !isProductsLoading &&
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
          <ProductsStatCards stats={stats} />
          {isFiltersOpen ? (
            <ProductsFilters
              sources={sources}
              value={filters}
              selectedSourceKey={selectedSourceKey}
              onChange={setFilters}
              disabled={sourcesLoading}
            />
          ) : null}
          <ProductsTable
            products={pagedProducts}
            isLoading={sourcesLoading || isProductsLoading}
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
          />
        </>
      )}
    </div>
  )
}

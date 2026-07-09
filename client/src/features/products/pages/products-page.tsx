import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { ProductsFilters } from "@/features/products/components/products-filters"
import { ProductsHeader } from "@/features/products/components/products-header"
import { ProductsStatCards } from "@/features/products/components/products-stat-cards"
import { ProductsTable } from "@/features/products/components/products-table"
import type { ProductFiltersState, ProductStats } from "@/features/products/types/product"
import { derivePlaceholderErpStatus } from "@/features/products/util/erp-status"
import { Button } from "@/components/ui/button"
import { DEFAULT_LIMIT, DEFAULT_PAGE, getPaginationMeta } from "@/shared/hooks/use-pagination"
import {
  useMarketplaceProductSourcesQuery,
  useMarketplaceProductsQuery,
} from "@/shared/queries/marketplace-product.query"
import {
  buildProductSourceKey,
  parseProductSourceKey,
} from "@/shared/services/marketplace-product.service"

const DEFAULT_FILTERS: ProductFiltersState = {
  sourceKey: "",
  erpStatus: "all",
  priceMin: "",
  priceMax: "",
}

export function ProductsPage() {
  const { t } = useTranslation("products")
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_FILTERS)

  const {
    data: sources = [],
    isLoading: sourcesLoading,
    error: sourcesError,
  } = useMarketplaceProductSourcesQuery()

  const activeSourceKey = useMemo(() => {
    if (filters.sourceKey) {
      return filters.sourceKey
    }
    if (sources.length > 0) {
      return buildProductSourceKey(sources[0].storeId, sources[0].marketplaceCode)
    }
    return ""
  }, [filters.sourceKey, sources])

  const parsedSource = useMemo(
    () => (activeSourceKey ? parseProductSourceKey(activeSourceKey) : null),
    [activeSourceKey]
  )

  const priceMin = filters.priceMin ? Number.parseFloat(filters.priceMin) : undefined
  const priceMax = filters.priceMax ? Number.parseFloat(filters.priceMax) : undefined

  const {
    data: productResult,
    isLoading: productsLoading,
    isFetching: productsFetching,
    error: productsError,
  } = useMarketplaceProductsQuery(
    parsedSource
      ? {
          storeId: parsedSource.storeId,
          marketplaceCode: parsedSource.marketplaceCode,
          page,
          limit,
          priceMin: Number.isFinite(priceMin) ? priceMin : undefined,
          priceMax: Number.isFinite(priceMax) ? priceMax : undefined,
        }
      : null,
    sources.length > 0
  )

  const productsWithErp = useMemo(
    () =>
      (productResult?.items ?? []).map((product) => ({
        ...product,
        erpStatus: derivePlaceholderErpStatus(product),
      })),
    [productResult?.items]
  )

  const filteredProducts = useMemo(() => {
    if (filters.erpStatus === "all") {
      return productsWithErp
    }
    return productsWithErp.filter((product) => product.erpStatus === filters.erpStatus)
  }, [filters.erpStatus, productsWithErp])

  const totalCount = productResult?.total ?? 0
  const pagination = getPaginationMeta(page, limit, totalCount)

  useEffect(() => {
    setPage(1)
  }, [activeSourceKey, filters.priceMin, filters.priceMax, filters.erpStatus])

  const stats: ProductStats = useMemo(() => {
    const syncedCount = productsWithErp.filter((product) => product.erpStatus === "synced").length
    const unmappedCount = productsWithErp.filter((product) => product.erpStatus === "unmapped").length
    const totalOnPage = productsWithErp.length

    return {
      mappingRatePercent: totalOnPage > 0 ? (syncedCount / totalOnPage) * 100 : 0,
      actionRequiredCount: unmappedCount,
      activeSkuCount: syncedCount,
    }
  }, [productsWithErp])

  const requestError =
    sourcesError != null
      ? t("errors.load_sources_failed")
      : productsError != null
        ? t("errors.load_products_failed")
        : null

  const showEmptyConnections = !sourcesLoading && sources.length === 0

  return (
    <div className="space-y-6 p-6">
      <ProductsHeader isSyncing={productsFetching} />
      <AuthFormError message={requestError} />

      {showEmptyConnections ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("empty.no_connections")}</p>
          <Button asChild className="mt-4">
            <Link to={ROUTES.dashboard.stores}>{t("empty.go_to_stores")}</Link>
          </Button>
        </div>
      ) : (
        <>
          <ProductsFilters
            sources={sources}
            value={filters}
            selectedSourceKey={activeSourceKey}
            onChange={setFilters}
            disabled={sourcesLoading}
          />
          <ProductsTable
            products={filteredProducts}
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
          />
          <ProductsStatCards stats={stats} />
        </>
      )}
    </div>
  )
}

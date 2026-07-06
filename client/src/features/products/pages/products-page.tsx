import { useMemo } from "react"

import { ProductsFilters } from "@/features/products/components/products-filters"
import { ProductsHeader } from "@/features/products/components/products-header"
import { ProductsStatCards } from "@/features/products/components/products-stat-cards"
import { ProductsTable } from "@/features/products/components/products-table"
import {
  getMockProductsPage,
  MOCK_PRODUCT_STATS,
  MOCK_PRODUCTS_TOTAL,
} from "@/features/products/data/mock-products"
import { usePagination } from "@/shared/hooks/use-pagination"

export function ProductsPage() {
  const {
    page,
    limit,
    totalPages,
    start,
    end,
    canGoPrev,
    canGoNext,
    setPage,
    setLimit,
  } = usePagination({ total: MOCK_PRODUCTS_TOTAL })

  const products = useMemo(
    () => getMockProductsPage(page, limit),
    [page, limit]
  )

  return (
    <div className="space-y-6 p-6">
      <ProductsHeader />
      <ProductsFilters />
      <ProductsTable
        products={products}
        totalCount={MOCK_PRODUCTS_TOTAL}
        page={page}
        limit={limit}
        totalPages={totalPages}
        start={start}
        end={end}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
      <ProductsStatCards stats={MOCK_PRODUCT_STATS} />
    </div>
  )
}

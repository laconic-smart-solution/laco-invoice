import { useMemo } from "react"

import { OrdersFilters } from "@/features/orders/components/orders-filters"
import { OrdersHeader } from "@/features/orders/components/orders-header"
import { OrdersTable } from "@/features/orders/components/orders-table"
import {
  getMockOrdersPage,
  MOCK_ORDERS_TOTAL,
} from "@/features/orders/data/mock-orders"
import { usePagination } from "@/shared/hooks/use-pagination"

export function OrdersPage() {
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
  } = usePagination({ total: MOCK_ORDERS_TOTAL })

  const orders = useMemo(
    () => getMockOrdersPage(page, limit),
    [page, limit]
  )

  return (
    <div className="space-y-6 p-6">
      <OrdersHeader />
      <OrdersFilters />
      <OrdersTable
        orders={orders}
        totalCount={MOCK_ORDERS_TOTAL}
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
    </div>
  )
}

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { OrdersFilters } from "@/features/orders/components/orders-filters"
import { OrdersHeader } from "@/features/orders/components/orders-header"
import { OrdersTable } from "@/features/orders/components/orders-table"
import {
  DEFAULT_ORDER_FILTERS,
  type OrderFiltersState,
} from "@/features/orders/types/order-filters"
import { mapOrderDtoToOrder } from "@/features/orders/util/map-order"
import type { ApiOrderStatus } from "@/shared/services/order.service"
import { getPaginationMeta, usePagination } from "@/shared/hooks/use-pagination"
import {
  getOrderErrorMessage,
  useOrdersPageQuery,
  useTriggerOrderSyncMutation,
} from "@/shared/queries/order.query"
import { useMarketplaceProductSourcesQuery } from "@/shared/queries/marketplace-product.query"
import {
  buildProductSourceKey,
  parseProductSourceKey,
} from "@/shared/services/marketplace-product.service"

export function OrdersPage() {
  const { t } = useTranslation("orders")
  const { page, limit, setPage, setLimit } = usePagination()
  const [filters, setFilters] = useState<OrderFiltersState>(DEFAULT_ORDER_FILTERS)

  const { data: sources = [], isLoading: sourcesLoading } =
    useMarketplaceProductSourcesQuery()

  useEffect(() => {
    if (sources.length === 0 || filters.sourceKey) {
      return
    }
    const firstSource = sources[0]
    setFilters((current) => ({
      ...current,
      sourceKey: buildProductSourceKey(firstSource.storeId, firstSource.marketplaceCode),
    }))
  }, [filters.sourceKey, sources])

  const selectedSourceKey = filters.sourceKey || "all"
  const parsedSource = useMemo(
    () => (filters.sourceKey ? parseProductSourceKey(filters.sourceKey) : null),
    [filters.sourceKey]
  )

  const pageRequest = useMemo(() => {
    const filter: {
      storeId?: number
      marketplaceCode?: string
      orderStatus?: ApiOrderStatus
    } = {}

    if (parsedSource) {
      filter.storeId = parsedSource.storeId
      filter.marketplaceCode = parsedSource.marketplaceCode
    }

    if (filters.orderStatus !== "all") {
      filter.orderStatus = filters.orderStatus as ApiOrderStatus
    }

    return {
      pageNumber: page,
      pageSize: limit,
      ...(Object.keys(filter).length > 0 ? { filter } : {}),
    }
  }, [filters.orderStatus, limit, page, parsedSource])

  const { data, isLoading, isError, error } = useOrdersPageQuery(pageRequest)
  const syncMutation = useTriggerOrderSyncMutation()

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

  return (
    <div className="space-y-6 p-6">
      <OrdersHeader
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
      />
      <AuthFormError message={syncError} />
      <OrdersFilters
        sources={sources}
        value={filters}
        selectedSourceKey={selectedSourceKey}
        onChange={handleFiltersChange}
        disabled={sourcesLoading}
      />
      <AuthFormError message={loadError} />
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
      />
    </div>
  )
}

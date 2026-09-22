import { useMemo, useState } from "react"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { OrdersFilters } from "@/features/orders/components/orders-filters"
import { OrdersTable } from "@/features/orders/components/orders-table"
import {
  DEFAULT_ORDER_FILTERS,
  type OrderFiltersState,
} from "@/features/orders/types/order-filters"
import { mapOrderDtoToOrder } from "@/features/orders/util/map-order"
import { FLOW_STORES_LIST_REQUEST } from "@/features/flow/data/flow-constants"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { getPaginationMeta } from "@/shared/hooks/use-pagination"
import {
  getOrderErrorMessage,
  useOrdersPageQuery,
} from "@/shared/queries/order.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import type {
  ApiOrderSourceType,
  ApiOrderStatus,
} from "@/shared/services/order.service"
import { getColumnFilterValue } from "@/util/table-column-filters"
import { sortingToPageSort } from "@/util/table-sort"

const ORDER_SORT_FIELD_MAP: Record<string, string> = {
  orderId: "externalOrderId",
  orderDate: "orderDate",
  storeName: "store.name",
  customer: "customer.name",
  totalAmount: "totalAmount",
}

export function FlowOrdersWorkspace() {
  const { t } = useTranslation("flow")
  const { t: tOrders } = useTranslation("orders")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [filters, setFilters] = useState<OrderFiltersState>(DEFAULT_ORDER_FILTERS)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const debouncedColumnFilters = useDebounce(columnFilters)
  const debouncedSearch = useDebounce(filters.search)

  const storesQuery = useStoresPageQuery(FLOW_STORES_LIST_REQUEST)
  const stores = Array.isArray(storesQuery.data?.data)
    ? storesQuery.data.data
    : []

  const pageSort = useMemo(
    () => sortingToPageSort(sorting, ORDER_SORT_FIELD_MAP),
    [sorting]
  )
  const columnOrderId = useMemo(
    () => getColumnFilterValue(debouncedColumnFilters, "orderId"),
    [debouncedColumnFilters]
  )

  const pageRequest = useMemo(() => {
    const filter: {
      storeId?: number
      orderStatus?: ApiOrderStatus
      sourceType?: ApiOrderSourceType
      externalOrderId?: string
    } = {}

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
    const orderSearch = columnOrderId || debouncedSearch.trim()
    if (orderSearch) {
      filter.externalOrderId = orderSearch
    }

    return {
      pageNumber: page,
      pageSize: limit,
      ...pageSort,
      ...(Object.keys(filter).length > 0 ? { filter } : {}),
    }
  }, [
    columnOrderId,
    debouncedSearch,
    filters.orderStatus,
    filters.sourceType,
    filters.storeId,
    limit,
    page,
    pageSort,
  ])

  const ordersQuery = useOrdersPageQuery(pageRequest)
  const orders = useMemo(
    () => (ordersQuery.data?.data ?? []).map(mapOrderDtoToOrder),
    [ordersQuery.data?.data]
  )
  const totalCount = ordersQuery.data?.meta?.totalElements ?? 0
  const meta = getPaginationMeta(page, limit, totalCount)
  const loadError =
    ordersQuery.isError && ordersQuery.error
      ? getOrderErrorMessage(
          ordersQuery.error,
          tOrders("errors.load_failed")
        )
      : null

  return (
    <main className="flow-stage-workspace">
      <header className="flow-stage-workspace__header">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            {t("workspace.current")}
          </p>
          <h1 className="mt-1 truncate font-heading text-xl font-semibold tracking-tight text-foreground">
            {t("workspace.orders_heading")}
          </h1>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {t("workspace.orders_hint")}
          </p>
        </div>
      </header>
      <section className="flow-stage-content space-y-4">
        <OrdersFilters
          stores={stores}
          value={filters}
          onChange={(next) => {
            setFilters(next)
            setPage(1)
          }}
          disabled={storesQuery.isLoading}
        />
        <AuthFormError message={loadError} />
        <OrdersTable
          orders={orders}
          totalCount={totalCount}
          page={page}
          limit={limit}
          totalPages={meta.totalPages}
          start={meta.start}
          end={meta.end}
          canGoPrev={meta.canGoPrev}
          canGoNext={meta.canGoNext}
          isLoading={ordersQuery.isLoading}
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
          onColumnFiltersChange={(next) => {
            setColumnFilters(next)
            setPage(1)
          }}
        />
      </section>
    </main>
  )
}

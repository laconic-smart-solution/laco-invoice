export interface OrderFiltersState {
  storeId: string
  orderStatus: string
  sourceType: string
  search: string
}

export const DEFAULT_ORDER_FILTERS: OrderFiltersState = {
  storeId: "",
  orderStatus: "all",
  sourceType: "all",
  search: "",
}

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: "all", labelKey: "filters.status_all" },
  { value: "PENDING", labelKey: "order_status.pending" },
  { value: "CONFIRMED", labelKey: "order_status.confirmed" },
  { value: "SHIPPED", labelKey: "order_status.shipped" },
  { value: "DELIVERED", labelKey: "order_status.delivered" },
  { value: "CANCELLED", labelKey: "order_status.cancelled" },
] as const

export const ORDER_SOURCE_FILTER_OPTIONS = [
  { value: "all", labelKey: "filters.source_all" },
  { value: "API", labelKey: "source_type.api" },
  { value: "IMPORT", labelKey: "source_type.import" },
] as const

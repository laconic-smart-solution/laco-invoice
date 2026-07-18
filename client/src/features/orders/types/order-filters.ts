export interface OrderFiltersState {
  sourceKey: string
  orderStatus: string
  search: string
}

export const DEFAULT_ORDER_FILTERS: OrderFiltersState = {
  sourceKey: "",
  orderStatus: "all",
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

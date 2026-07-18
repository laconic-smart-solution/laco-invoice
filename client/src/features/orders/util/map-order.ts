import type {
  ApiOrderDetailDto,
  ApiOrderDto,
} from "@/shared/services/order.service"
import type { Order, OrderDetail, OrderLineItem } from "@/features/orders/types/order"

const EMPTY_VALUE = "—"

function formatStoreName(dto: ApiOrderDto): string {
  const storeName = dto.storeName?.trim()
  const marketplaceCode = dto.marketplaceCode?.trim()

  if (storeName && marketplaceCode) {
    return `${storeName} — ${marketplaceCode}`
  }
  if (storeName) {
    return storeName
  }
  if (marketplaceCode) {
    return marketplaceCode
  }
  return EMPTY_VALUE
}

function formatCustomerName(name?: string | null): string {
  const trimmed = name?.trim()
  return trimmed ? trimmed : EMPTY_VALUE
}

function resolveCurrency(dto: ApiOrderDto): string {
  const currency = dto.currency?.trim().toUpperCase()
  if (currency) {
    return currency
  }
  return dto.marketplaceCode?.trim().toUpperCase() === "LAZADA" ? "THB" : "USD"
}

function toOrderLineItem(item: ApiOrderDetailDto["items"][number]): OrderLineItem {
  return {
    id: String(item.id),
    name: item.productName?.trim() || item.sku?.trim() || EMPTY_VALUE,
    sku: item.sku?.trim() || EMPTY_VALUE,
    quantity: item.quantity,
    unitPrice: item.price,
  }
}

export function mapOrderDtoToOrder(dto: ApiOrderDto): Order {
  return {
    id: String(dto.id),
    orderId: dto.externalOrderId,
    orderDate: dto.orderDate ?? "",
    storeId: String(dto.storeId),
    storeName: formatStoreName(dto),
    customer: formatCustomerName(dto.customerName),
    totalAmount: dto.totalAmount,
    currency: resolveCurrency(dto),
    syncStatus: "pending",
  }
}

export function mapOrderDetailDtoToOrderDetail(detail: ApiOrderDetailDto): OrderDetail {
  const base = mapOrderDtoToOrder(detail.order)
  const customer = detail.customer

  return {
    ...base,
    customer: formatCustomerName(customer?.name ?? base.customer),
    customerEmail: customer?.email?.trim() || EMPTY_VALUE,
    shippingAddress: customer?.address?.trim() || EMPTY_VALUE,
    subtotal: detail.order.subtotal,
    tax: 0,
    shipping: detail.order.shippingFee,
    lineItems: detail.items.map(toOrderLineItem),
    lastSyncedAt: detail.order.createdAt,
  }
}

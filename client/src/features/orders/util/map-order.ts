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
    productId: item.productId != null ? String(item.productId) : undefined,
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
    customerId: dto.customerId != null ? String(dto.customerId) : undefined,
    customerPhone: dto.customerPhone?.trim() || undefined,
    invoiceId: dto.invoiceId != null ? String(dto.invoiceId) : undefined,
    totalAmount: dto.totalAmount,
    currency: resolveCurrency(dto),
    syncStatus: mapOrderStatusToSyncBadge(dto.orderStatus),
    sourceType: dto.sourceType === "IMPORT" ? "IMPORT" : "API",
  }
}

function mapOrderStatusToSyncBadge(
  status: ApiOrderDto["orderStatus"] | undefined
): Order["syncStatus"] {
  switch (status) {
    case "SHIPPED":
    case "DELIVERED":
    case "CONFIRMED":
      return "synced"
    case "CANCELLED":
      return "failed"
    default:
      return "pending"
  }
}

export function mapOrderDetailDtoToOrderDetail(detail: ApiOrderDetailDto): OrderDetail {
  const base = mapOrderDtoToOrder(detail.order)
  const customer = detail.customer
  const totalAmount = detail.order.totalAmount
  const amountExVat =
    detail.order.amountExVat ??
    (totalAmount != null ? Math.round((totalAmount / 1.07) * 100) / 100 : 0)
  const vatAmount =
    detail.order.vatAmount ??
    (totalAmount != null ? Math.round((totalAmount - amountExVat) * 100) / 100 : 0)

  return {
    ...base,
    customer: formatCustomerName(customer?.name ?? base.customer),
    customerId: customer?.id != null ? String(customer.id) : base.customerId,
    customerEmail: customer?.email?.trim() || EMPTY_VALUE,
    customerPhone: customer?.phone?.trim() || base.customerPhone || EMPTY_VALUE,
    customerGender: customer?.gender?.trim() || EMPTY_VALUE,
    shippingAddress: customer?.address?.trim() || EMPTY_VALUE,
    subtotal: detail.order.subtotal,
    tax: vatAmount,
    amountExVat,
    vatAmount,
    shipping: detail.order.shippingFee,
    lineItems: detail.items.map(toOrderLineItem),
    lastSyncedAt: detail.order.createdAt,
  }
}

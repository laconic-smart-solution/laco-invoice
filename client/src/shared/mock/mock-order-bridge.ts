import type { OrderDetail } from "@/features/orders/types/order"
import {
  getMockOrderById,
  getMockOrdersPage,
  MOCK_ORDERS_TOTAL,
} from "@/features/orders/data/mock-orders"
import type {
  ApiCustomerInfoDto,
  ApiOrderDto,
  ApiOrderDetailDto,
  ApiOrderHistoryEventDto,
  ApiOrderItemDto,
  ApiOrderStatus,
} from "@/shared/services/order.service"
import { getStoreById } from "@/shared/mock/mock-seed-data"

const STORE_SLUG_TO_ID: Record<string, number> = {
  "tiktok-us": 1,
  "tiktok-uk": 2,
  "tiktok-sg": 3,
}

function syncStatusToOrderStatus(syncStatus: OrderDetail["syncStatus"]): ApiOrderStatus {
  switch (syncStatus) {
    case "synced":
      return "DELIVERED"
    case "failed":
      return "CANCELLED"
    default:
      return "PENDING"
  }
}

function resolveStoreId(detail: OrderDetail): number {
  const numeric = Number.parseInt(detail.storeId, 10)
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric
  }
  return STORE_SLUG_TO_ID[detail.storeId] ?? 1
}

function resolveMarketplaceForStore(storeId: number): {
  marketplaceId: number
  marketplaceCode: string
} {
  if (storeId === 3) {
    return { marketplaceId: 1, marketplaceCode: "LAZADA" }
  }
  return { marketplaceId: 3, marketplaceCode: "TIKTOK" }
}

export function orderDetailToApiDto(detail: OrderDetail): ApiOrderDto {
  const storeId = resolveStoreId(detail)
  const store = getStoreById(storeId)
  const { marketplaceId, marketplaceCode } = resolveMarketplaceForStore(storeId)
  const customerId = detail.customerId ? Number.parseInt(detail.customerId, 10) : null

  return {
    id: Number.parseInt(detail.id, 10),
    storeId,
    storeName: store?.name ?? detail.storeName,
    marketplaceId,
    marketplaceCode,
    customerId: Number.isFinite(customerId) ? customerId : null,
    customerName: detail.customer === "—" ? null : detail.customer,
    customerPhone: detail.customerPhone ?? null,
    externalOrderId: detail.orderId,
    orderStatus: syncStatusToOrderStatus(detail.syncStatus),
    sourceType: detail.sourceType,
    subtotal: detail.subtotal,
    shippingFee: detail.shipping,
    amountExVat: detail.amountExVat,
    vatAmount: detail.vatAmount,
    totalAmount: detail.totalAmount,
    totalFees: detail.totalFees,
    totalAdsFee: detail.totalAdjustments,
    currency: detail.currency,
    orderDate: detail.orderDate,
    createdAt: detail.lastSyncedAt ?? detail.orderDate,
  }
}

function lineItemsToApiItems(detail: OrderDetail): ApiOrderItemDto[] {
  return detail.lineItems.map((item, index) => ({
    id: Number.parseInt(item.id.split("-")[1] ?? String(index + 1), 10) || index + 1,
    productId: item.productId ? Number.parseInt(item.productId, 10) : null,
    sku: item.sku,
    productName: item.name,
    price: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.quantity * item.unitPrice,
  }))
}

function customerToApiInfo(detail: OrderDetail): ApiCustomerInfoDto | null {
  const customerId = detail.customerId ? Number.parseInt(detail.customerId, 10) : null
  if (!Number.isFinite(customerId)) {
    return null
  }

  return {
    id: customerId as number,
    name: detail.customer === "—" ? null : detail.customer,
    email: detail.customerEmail === "—" ? null : detail.customerEmail,
    phone: detail.customerPhone === "—" ? null : detail.customerPhone,
    gender: detail.customerGender === "—" ? null : detail.customerGender,
    address: detail.shippingAddress === "—" ? null : detail.shippingAddress,
  }
}

export function orderDetailToApiDetail(detail: OrderDetail): ApiOrderDetailDto {
  return {
    order: orderDetailToApiDto(detail),
    customer: customerToApiInfo(detail),
    items: lineItemsToApiItems(detail),
  }
}

export function getMockApiOrdersPage(page: number, pageSize: number): ApiOrderDto[] {
  return getMockOrdersPage(page, pageSize).map((order) => {
    const detail = getMockOrderById(order.id)
    return detail ? orderDetailToApiDto(detail) : orderDetailToApiDto(order as OrderDetail)
  })
}

export function getMockApiOrderDetail(id: number): ApiOrderDetailDto | null {
  const detail = getMockOrderById(String(id))
  return detail ? orderDetailToApiDetail(detail) : null
}

export function getMockOrderStats(): {
  totalOrders: number
  totalRevenue: number
  totalFees: number
  totalAdsFee: number
} {
  const sample = getMockApiOrdersPage(1, 100)
  const totalRevenue = sample.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalFees = sample.reduce((sum, o) => sum + o.totalFees, 0)
  const totalAdsFee = sample.reduce((sum, o) => sum + o.totalAdsFee, 0)

  return {
    totalOrders: MOCK_ORDERS_TOTAL,
    totalRevenue: Math.round(totalRevenue * (MOCK_ORDERS_TOTAL / 100)),
    totalFees: Math.round(totalFees * (MOCK_ORDERS_TOTAL / 100)),
    totalAdsFee: Math.round(totalAdsFee * (MOCK_ORDERS_TOTAL / 100)),
  }
}

export function getMockOrderHistory(orderId: number): ApiOrderHistoryEventDto[] {
  const detail = getMockOrderById(String(orderId))
  if (!detail) {
    return []
  }

  return [
    {
      id: orderId * 10,
      action: "CREATE",
      source: detail.sourceType === "IMPORT" ? "IMPORT_EXCEL" : "MANUAL",
      updatedByUserId: 1,
      updatedBy: "Mock Admin",
      updatedAt: detail.orderDate,
      importFileId: detail.sourceType === "IMPORT" ? 1 : null,
      excelFileName: detail.sourceType === "IMPORT" ? "orders-import.xlsx" : null,
      note: null,
      changes: [
        {
          field: "totalAmount",
          fieldLabelKey: "orders:history.fields.total_amount",
          before: null,
          after: String(detail.totalAmount),
          valueType: "DECIMAL",
        },
      ],
    },
  ]
}

import type {
  Order,
  OrderDetail,
  OrderLineItem,
  OrderSyncStatus,
} from "@/features/orders/types/order"

export const MOCK_ORDERS_TOTAL = 4284

const STORES = [
  { id: "tiktok-us", name: "TikTok Shop US" },
  { id: "tiktok-uk", name: "TikTok Shop UK" },
  { id: "tiktok-sg", name: "TikTok Shop SG" },
] as const

const CUSTOMERS = [
  "Marcus Thompson",
  "Elena Rodriguez",
  "James Chen",
  "Sarah Johnson",
  "David Kim",
  "Priya Patel",
  "Oliver Wright",
  "Hannah Lee",
  "Carlos Mendez",
  "Aisha Khan",
] as const

const PRODUCTS = [
  { name: "Wireless Earbuds Pro", sku: "WEP-001" },
  { name: "Smart Watch Band", sku: "SWB-014" },
  { name: "USB-C Charging Cable", sku: "UCC-220" },
  { name: "Phone Stand Holder", sku: "PSH-088" },
  { name: "Portable Power Bank", sku: "PPB-512" },
] as const

function getSyncStatus(index: number): OrderSyncStatus {
  const mod = index % 10
  if (mod < 5) return "synced"
  if (mod < 8) return "pending"
  return "failed"
}

function formatOrderDate(index: number): string {
  const day = (index % 24) + 1
  const month = 10
  const year = 2023
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function buildLineItems(globalIndex: number): OrderLineItem[] {
  const itemCount = (globalIndex % 3) + 2

  return Array.from({ length: itemCount }, (_, itemIndex) => {
    const product = PRODUCTS[(globalIndex + itemIndex) % PRODUCTS.length]
    const quantity = (itemIndex % 2) + 1
    const unitPrice = 12.5 + ((globalIndex + itemIndex) % 8) * 9.75

    return {
      id: `${globalIndex + 1}-${itemIndex + 1}`,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice,
    }
  })
}

function buildMockOrder(globalIndex: number): OrderDetail {
  const store = STORES[globalIndex % STORES.length]
  const customer = CUSTOMERS[globalIndex % CUSTOMERS.length]
  const lineItems = buildLineItems(globalIndex)
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const tax = subtotal * 0.08
  const shipping = globalIndex % 2 === 0 ? 0 : 5.99
  const totalAmount = subtotal + tax + shipping
  const syncStatus = getSyncStatus(globalIndex)
  const emailSlug = customer.toLowerCase().replace(/\s+/g, ".")

  return {
    id: String(globalIndex + 1),
    orderId: `#TK-${8942 + globalIndex}-${String((globalIndex % 99) + 1).padStart(2, "0")}`,
    orderDate: formatOrderDate(globalIndex),
    storeId: store.id,
    storeName: store.name,
    customer,
    customerId: String(1000 + (globalIndex % CUSTOMERS.length)),
    customerEmail: `${emailSlug}@example.com`,
    customerPhone: `+1 415 555 ${String(1000 + (globalIndex % 9000)).padStart(4, "0")}`,
    customerGender: globalIndex % 2 === 0 ? "FEMALE" : "MALE",
    shippingAddress: `${100 + (globalIndex % 900)} Market Street, Suite ${(globalIndex % 40) + 1}, San Francisco, CA 94103`,
    totalAmount,
    totalFees: 0,
    totalAdjustments: 0,
    currency: "USD",
    subtotal,
    tax,
    amountExVat: Math.round((totalAmount / 1.07) * 100) / 100,
    vatAmount: Math.round((totalAmount - totalAmount / 1.07) * 100) / 100,
    shipping,
    syncStatus,
    sourceType: globalIndex % 3 === 0 ? "IMPORT" : "API",
    lineItems,
    lastSyncedAt:
      syncStatus === "synced"
        ? `2023-10-${String((globalIndex % 24) + 1).padStart(2, "0")}T14:30:00Z`
        : undefined,
  }
}

export function getMockOrderById(id: string): OrderDetail | null {
  const index = Number.parseInt(id, 10)

  if (!Number.isFinite(index) || index < 1 || index > MOCK_ORDERS_TOTAL) {
    return null
  }

  return buildMockOrder(index - 1)
}

export function getMockOrdersPage(page: number, limit: number): Order[] {
  const offset = (page - 1) * limit
  const count = Math.min(limit, Math.max(MOCK_ORDERS_TOTAL - offset, 0))

  return Array.from({ length: count }, (_, index) =>
    buildMockOrder(offset + index)
  )
}

export const ORDER_STORE_FILTER_OPTIONS = [
  { value: "all", labelKey: "filters.store_all" },
  { value: "tiktok-us", labelKey: "filters.store_tiktok_us" },
  { value: "tiktok-uk", labelKey: "filters.store_tiktok_uk" },
  { value: "tiktok-sg", labelKey: "filters.store_tiktok_sg" },
] as const

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: "all", labelKey: "filters.status_all" },
  { value: "synced", labelKey: "sync_status.synced" },
  { value: "pending", labelKey: "sync_status.pending" },
  { value: "failed", labelKey: "sync_status.failed" },
] as const

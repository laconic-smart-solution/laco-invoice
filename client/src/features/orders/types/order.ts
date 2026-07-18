export type OrderSyncStatus = "synced" | "pending" | "failed"

export interface OrderLineItem {
  id: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  orderId: string
  orderDate: string
  storeId: string
  storeName: string
  customer: string
  customerId?: string
  customerPhone?: string
  invoiceId?: string
  totalAmount: number
  currency: string
  syncStatus: OrderSyncStatus
}

export interface OrderDetail extends Order {
  customerEmail: string
  customerPhone: string
  customerGender: string
  shippingAddress: string
  subtotal: number
  tax: number
  shipping: number
  lineItems: OrderLineItem[]
  invoiceId?: string
  lastSyncedAt?: string
}

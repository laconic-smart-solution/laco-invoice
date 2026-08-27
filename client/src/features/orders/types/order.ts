export type OrderSyncStatus = "synced" | "pending" | "failed"

export type OrderSourceType = "API" | "IMPORT"

export interface OrderLineItem {
  id: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  productId?: string
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
  totalAmount: number
  totalFees: number
  totalAdjustments: number
  tiktokCommissionFee?: number
  transactionFee?: number
  affiliateCommission?: number
  adsFee?: number
  shippingFeeDeduction?: number
  currency: string
  syncStatus: OrderSyncStatus
  sourceType: OrderSourceType
}

export interface OrderDetail extends Order {
  customerEmail: string
  customerPhone: string
  customerGender: string
  shippingAddress: string
  subtotal: number
  tax: number
  amountExVat: number
  vatAmount: number
  shipping: number
  lineItems: OrderLineItem[]
  lastSyncedAt?: string
}

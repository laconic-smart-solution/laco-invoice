export type OrderStatus = "synced" | "pending" | "error" | "draft"

export interface RecentOrder {
  id: string
  orderId: string
  customer: string
  amount: number
  status: OrderStatus
}

export interface DashboardStats {
  totalRevenue: number
  revenueTrendPercent: number
  lastSyncMinutesAgo: number
  channelCount: number
  totalOrders: number
  syncedOrders: number
  pendingOrders: number
  invoicesIssued: number
  invoicesPaid: number
  invoicesOverdue: number
}

export interface MarketplaceChannel {
  id: string
  nameKey: "tiktok" | "shopify" | "amazon"
  iconClassName: string
}

import type {
  DashboardStats,
  MarketplaceChannel,
  RecentOrder,
} from "@/features/dashboard/types/dashboard"

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalRevenue: 142850.24,
  revenueTrendPercent: 12.4,
  lastSyncMinutesAgo: 2,
  channelCount: 4,
  totalOrders: 1204,
  syncedOrders: 892,
  pendingOrders: 312,
  invoicesIssued: 948,
  invoicesPaid: 840,
  invoicesOverdue: 24,
}

export const MOCK_RECENT_ORDERS: RecentOrder[] = [
  {
    id: "1",
    orderId: "#TK-883921",
    customer: "Marcus Aurelius",
    amount: 124.5,
    status: "synced",
  },
  {
    id: "2",
    orderId: "#TK-883920",
    customer: "Elena Rodriguez",
    amount: 89.99,
    status: "pending",
  },
  {
    id: "3",
    orderId: "#TK-883919",
    customer: "James Chen",
    amount: 256.0,
    status: "error",
  },
  {
    id: "4",
    orderId: "#TK-883918",
    customer: "Sarah Johnson",
    amount: 45.75,
    status: "draft",
  },
  {
    id: "5",
    orderId: "#TK-883917",
    customer: "David Kim",
    amount: 312.4,
    status: "synced",
  },
]

export const MOCK_MARKETPLACES: MarketplaceChannel[] = [
  {
    id: "lazada",
    nameKey: "lazada",
    iconClassName: "bg-primary text-primary-foreground",
  },
  {
    id: "shopee",
    nameKey: "shopee",
    iconClassName: "bg-success text-success-foreground",
  },
  {
    id: "tiktok",
    nameKey: "tiktok",
    iconClassName: "bg-foreground text-background",
  },
]

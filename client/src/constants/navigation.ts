import {
  FileText,
  LayoutGrid,
  Package,
  ShoppingCart,
  Store,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ROUTES } from "@/app/constants/routes"

export interface SidebarNavItem {
  key: string
  path: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { key: "dashboard", path: ROUTES.dashboard.root, icon: LayoutGrid },
  { key: "stores", path: ROUTES.dashboard.stores, icon: Store },
  { key: "products", path: ROUTES.dashboard.products, icon: Package },
  { key: "orders", path: ROUTES.dashboard.orders, icon: ShoppingCart },
  { key: "invoices", path: ROUTES.dashboard.invoices, icon: FileText },
  { key: "customers", path: ROUTES.dashboard.customers, icon: Users },
  { key: "users", path: ROUTES.dashboard.users, icon: UserCog, adminOnly: true },
]

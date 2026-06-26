import {
  FileText,
  LayoutGrid,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ROUTES } from "@/app/constants/routes"

export interface SidebarNavItem {
  key: string
  path: string
  icon: LucideIcon
}

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { key: "dashboard", path: ROUTES.dashboard.root, icon: LayoutGrid },
  { key: "stores", path: ROUTES.dashboard.stores, icon: Store },
  { key: "products", path: ROUTES.dashboard.products, icon: Package },
  { key: "orders", path: ROUTES.dashboard.orders, icon: ShoppingCart },
  { key: "invoices", path: ROUTES.dashboard.invoices, icon: FileText },
  { key: "customers", path: ROUTES.dashboard.customers, icon: Users },
  { key: "settings", path: ROUTES.dashboard.settings, icon: Settings },
]

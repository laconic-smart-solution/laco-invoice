import {
  Keyboard,
  LayoutGrid,
  Package,
  ShoppingCart,
  Store,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ROUTES } from "@/app/constants/routes"

export interface SidebarNavChild {
  key: string
  path: string
}

export interface SidebarNavItem {
  key: string
  path: string
  icon: LucideIcon
  adminOnly?: boolean
  children?: SidebarNavChild[]
}

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { key: "dashboard", path: ROUTES.dashboard.root, icon: LayoutGrid },
  { key: "stores", path: ROUTES.dashboard.stores, icon: Store },
  { key: "products", path: ROUTES.dashboard.products, icon: Package },
  {
    key: "orders",
    path: ROUTES.dashboard.orders,
    icon: ShoppingCart,
    children: [
      { key: "order_list", path: ROUTES.dashboard.orders },
      // Temporarily hidden from navbar — route still works at /orders/imports
      // { key: "order_imports", path: ROUTES.dashboard.orderImports },
      { key: "order_inputs", path: ROUTES.dashboard.orderInputs },
    ],
  },
  { key: "customers", path: ROUTES.dashboard.customers, icon: Users },
  { key: "users", path: ROUTES.dashboard.users, icon: UserCog, adminOnly: true },
  { key: "shortcuts", path: ROUTES.dashboard.shortcuts, icon: Keyboard },
]

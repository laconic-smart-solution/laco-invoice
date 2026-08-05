import { ROUTES } from "@/app/constants/routes"
import type {
  ClassicDetail,
  ClassicPanel,
  ClassicSetupType,
} from "@/shared/stores/classic-workspace-store"

export interface ClassicRouteMatch {
  panel: ClassicPanel
  detail: ClassicDetail | null
  setup: ClassicSetupType | null
}

const MARKETPLACE_CALLBACK =
  /^\/stores\/(lazada|shopee|tiktok)\/callback(?:\/|$)/i

/** Paths handled by ClassicWorkspace instead of feature pages. */
export function parseClassicRoute(pathname: string): ClassicRouteMatch | null {
  if (MARKETPLACE_CALLBACK.test(pathname)) {
    return null
  }

  if (pathname === ROUTES.dashboard.root) {
    return { panel: "overview", detail: null, setup: null }
  }

  // Import file routes use full pages under classic chrome (not workspace panels).
  if (
    pathname === ROUTES.dashboard.orderImports ||
    pathname.startsWith(`${ROUTES.dashboard.orderImports}/`)
  ) {
    return null
  }

  if (pathname === ROUTES.dashboard.orders) {
    return { panel: "orders", detail: null, setup: null }
  }
  const orderMatch = pathname.match(/^\/orders\/([^/]+)$/)
  if (orderMatch && orderMatch[1] !== "imports") {
    return {
      panel: "orders",
      detail: { type: "order", id: orderMatch[1] },
      setup: null,
    }
  }

  if (pathname === ROUTES.dashboard.products) {
    return { panel: "products", detail: null, setup: null }
  }
  const productMatch = pathname.match(/^\/products\/([^/]+)$/)
  if (productMatch) {
    return {
      panel: "products",
      detail: { type: "product", id: productMatch[1] },
      setup: null,
    }
  }

  if (pathname === ROUTES.dashboard.stores) {
    return { panel: "stores", detail: null, setup: null }
  }
  if (pathname === ROUTES.dashboard.storeCreate) {
    return { panel: "stores", detail: null, setup: "store" }
  }
  const storeMatch = pathname.match(/^\/stores\/([^/]+)$/)
  if (storeMatch && storeMatch[1] !== "new") {
    return {
      panel: "stores",
      detail: { type: "store", id: storeMatch[1] },
      setup: null,
    }
  }

  if (pathname === ROUTES.dashboard.invoices) {
    return { panel: "invoices", detail: null, setup: null }
  }
  const invoiceMatch = pathname.match(/^\/invoices\/([^/]+)$/)
  if (invoiceMatch) {
    return {
      panel: "invoices",
      detail: { type: "invoice", id: invoiceMatch[1] },
      setup: null,
    }
  }

  if (pathname === ROUTES.dashboard.customers) {
    return { panel: "customers", detail: null, setup: null }
  }
  // /customers/new stays a full page under classic chrome (no create dialog yet).
  const customerEditMatch = pathname.match(/^\/customers\/([^/]+)\/edit$/)
  if (customerEditMatch) {
    return {
      panel: "customers",
      detail: { type: "customer", id: customerEditMatch[1] },
      setup: null,
    }
  }

  if (pathname === ROUTES.dashboard.users) {
    return { panel: "users", detail: null, setup: null }
  }
  // /users/new stays a full page under classic chrome.
  const userMatch = pathname.match(/^\/users\/([^/]+)$/)
  if (userMatch && userMatch[1] !== "new") {
    return {
      panel: "users",
      detail: { type: "user", id: userMatch[1] },
      setup: null,
    }
  }

  return null
}

export function classicPanelPath(panel: ClassicPanel): string {
  switch (panel) {
    case "overview":
      return ROUTES.dashboard.root
    case "orders":
      return ROUTES.dashboard.orders
    case "products":
      return ROUTES.dashboard.products
    case "stores":
      return ROUTES.dashboard.stores
    case "invoices":
      return ROUTES.dashboard.invoices
    case "customers":
      return ROUTES.dashboard.customers
    case "users":
      return ROUTES.dashboard.users
  }
}

export function classicDetailPath(detail: ClassicDetail): string {
  switch (detail.type) {
    case "order":
      return ROUTES.dashboard.orderDetail(detail.id)
    case "product":
      return ROUTES.dashboard.productDetail(detail.id)
    case "store":
      return ROUTES.dashboard.storeDetail(detail.id)
    case "invoice":
      return ROUTES.dashboard.invoiceDetail(detail.id)
    case "customer":
      return ROUTES.dashboard.customerEdit(detail.id)
    case "user":
      return ROUTES.dashboard.userDetail(detail.id)
  }
}

export const CLASSIC_NAV_PANEL_BY_KEY: Record<string, ClassicPanel | null> = {
  dashboard: "overview",
  orders: "orders",
  products: "products",
  stores: "stores",
  invoices: "invoices",
  customers: "customers",
  users: "users",
  shortcuts: null,
}

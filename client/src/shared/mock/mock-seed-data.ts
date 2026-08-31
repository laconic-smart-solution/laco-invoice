import type { Customer } from "@/features/customers/types/customer"
import type {
  MarketplaceProduct,
  MarketplaceProductDetail,
  MarketplaceProductSource,
  MarketplaceProductSyncRun,
} from "@/features/products/types/product"
import type { Store } from "@/features/stores/types/store"
import type { AdminUser } from "@/features/users/types/user"
import type { ApiOrderImportFileDto } from "@/shared/services/order-import-file.service"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"
import type { MarketplaceConnection } from "@/features/stores/types/store"

const NOW = "2024-06-15T10:00:00Z"

export const MOCK_MARKETPLACES = [
  { id: 1, code: "LAZADA" as const, name: "Lazada" },
  { id: 2, code: "SHOPEE" as const, name: "Shopee" },
  { id: 3, code: "TIKTOK" as const, name: "TikTok Shop" },
]

function buildStores(): Store[] {
  return [
    {
      id: 1,
      ownerId: 1,
      name: "TikTok Shop US",
      logoUrl: null,
      active: true,
      createdAt: NOW,
    },
    {
      id: 2,
      ownerId: 1,
      name: "TikTok Shop UK",
      logoUrl: null,
      active: true,
      createdAt: NOW,
    },
    {
      id: 3,
      ownerId: 1,
      name: "Lazada Thailand",
      logoUrl: null,
      active: true,
      createdAt: NOW,
    },
  ]
}

function buildCustomers(): Customer[] {
  const names = [
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
  ]

  return Array.from({ length: 48 }, (_, index) => {
    const name = names[index % names.length]
    const slug = name.toLowerCase().replace(/\s+/g, ".")
    const storeId = (index % 3) + 1
    const marketplaceId = storeId === 3 ? 1 : 3

    return {
      id: index + 1,
      storeId,
      storeName: buildStores()[storeId - 1]?.name ?? null,
      marketplaceId,
      marketplaceCode: marketplaceId === 1 ? "LAZADA" : "TIKTOK",
      externalCustomerId: `CUST-${10000 + index}`,
      name,
      email: `${slug}@example.com`,
      phone: `+66 81 ${String(100 + (index % 900)).padStart(3, "0")} ${String(1000 + index).padStart(4, "0")}`,
      gender: index % 2 === 0 ? "female" : "male",
      address: `${index + 10} Sukhumvit Road, Bangkok`,
      createdAt: NOW,
      updatedAt: NOW,
    }
  })
}

function buildUsers(): AdminUser[] {
  const roles: AdminUser["role"][] = ["ADMIN", "OWNER", "MANAGER", "STAFF"]
  return Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    email: `user${index + 1}@example.com`,
    authServerUserId: `mock-auth-${index + 1}`,
    fullName: `Mock User ${index + 1}`,
    role: roles[index % roles.length],
    active: index % 5 !== 0,
    createdAt: NOW,
    updatedAt: NOW,
  }))
}

function buildProducts(): MarketplaceProduct[] {
  const skus = ["WEP-001", "SWB-014", "UCC-220", "PSH-088", "PPB-512"]
  const names = [
    "Wireless Earbuds Pro",
    "Smart Watch Band",
    "USB-C Charging Cable",
    "Phone Stand Holder",
    "Portable Power Bank",
  ]

  return Array.from({ length: 36 }, (_, index) => {
    const storeId = (index % 3) + 1
    const marketplaceCode = storeId === 3 ? "LAZADA" : "TIKTOK"
    const sku = skus[index % skus.length]
    const name = names[index % names.length]

    return {
      id: index + 1,
      storeId,
      storeName: buildStores()[storeId - 1]?.name ?? "Store",
      marketplaceCode,
      marketplaceName: marketplaceCode,
      externalProductId: `EXT-${10000 + index}`,
      sku,
      name,
      price: String(99 + (index % 20) * 15),
      currency: marketplaceCode === "LAZADA" ? "THB" : "USD",
      status: "ACTIVE",
      erpStatus: index % 4 === 0 ? "unmapped" : "synced",
    }
  })
}

function buildProductDetail(product: MarketplaceProduct): MarketplaceProductDetail {
  return {
    id: product.id,
    storeId: product.storeId,
    storeName: product.storeName,
    marketplaceCode: product.marketplaceCode,
    marketplaceName: product.marketplaceName,
    externalProductId: product.externalProductId,
    sku: product.sku,
    name: product.name,
    description: `Mock description for ${product.name}`,
    price: product.price,
    currency: product.currency,
    status: product.status,
    images: [],
    variants: [
      {
        sku: product.sku,
        price: product.price,
        currency: product.currency,
        status: product.status,
        quantity: "100",
      },
    ],
    erp: {
      status: product.erpStatus === "synced" ? "MAPPED" : "UNMAPPED",
      localProductId: product.erpStatus === "synced" ? product.id : null,
      erpItemId: product.erpStatus === "synced" ? product.id * 10 : null,
      erpSku: product.erpStatus === "synced" ? `ERP-${product.sku}` : null,
      erpName: product.erpStatus === "synced" ? product.name : null,
      mappedAt: product.erpStatus === "synced" ? NOW : null,
    },
  }
}

function buildProductSources(): MarketplaceProductSource[] {
  return buildStores().flatMap((store) => {
    const marketplaceCode = store.id === 3 ? "LAZADA" : "TIKTOK"
    return {
      storeId: store.id,
      storeName: store.name,
      marketplaceCode,
      marketplaceName: marketplaceCode,
      externalConnectionId: `conn-${store.id}-${marketplaceCode}`,
      label: `${store.name} — ${marketplaceCode}`,
      country: store.id === 3 ? "TH" : "US",
      lastSyncedAt: NOW,
      syncStatus: "COMPLETED" as const,
    }
  })
}

function buildImportFiles(): ApiOrderImportFileDto[] {
  return Array.from({ length: 18 }, (_, index) => {
    const storeId = (index % 3) + 1
    const marketplaceId = storeId === 3 ? 1 : 3
    const status: ApiOrderImportFileDto["status"] =
      index % 7 === 0 ? "FAILED" : index % 5 === 0 ? "PARTIAL" : "COMPLETED"

    return {
      id: index + 1,
      storeId,
      storeName: buildStores()[storeId - 1]?.name ?? null,
      marketplaceId,
      marketplaceCode: marketplaceId === 1 ? "LAZADA" : "TIKTOK",
      originalFilename: `orders-import-${index + 1}.xlsx`,
      sheetName: "Order SKU list",
      rowCount: 50 + index * 3,
      importedOrders: 20 + index,
      importedItems: 40 + index * 2,
      status,
      createdAt: NOW,
      updatedAt: NOW,
    }
  })
}

function buildInputRuns(): ApiOrderInputRunDto[] {
  const statuses: ApiOrderInputRunDto["status"][] = [
    "DRAFT",
    "RUNNING",
    "COMPLETED",
    "PARTIAL",
    "FAILED",
  ]

  return Array.from({ length: 8 }, (_, index) => {
    const storeId = (index % 3) + 1
    const marketplaceId = storeId === 3 ? 1 : 3
    const status = statuses[index % statuses.length]

    return {
      id: index + 1,
      storeId,
      storeName: buildStores()[storeId - 1]?.name ?? null,
      marketplaceId,
      marketplaceCode: marketplaceId === 1 ? "LAZADA" : "TIKTOK",
      title: `Input run ${index + 1}`,
      status,
      orderDetailFilename: index > 0 ? `order-detail-${index}.xlsx` : null,
      orderDetailSize: index > 0 ? 12000 + index * 100 : null,
      orderDetailStatus: index > 0 ? "SUCCEEDED" : "MISSING",
      orderDetailError: null,
      orderDetailStartedAt: index > 0 ? NOW : null,
      orderDetailFinishedAt: index > 0 ? NOW : null,
      orderDetailBatchId: index > 0 ? index : null,
      orderDetailImportFileId: index > 0 ? index : null,
      withdrawFilename: index > 2 ? `withdraw-${index}.xlsx` : null,
      withdrawSize: index > 2 ? 8000 : null,
      withdrawStatus: index > 2 ? "SUCCEEDED" : "MISSING",
      withdrawError: null,
      withdrawStartedAt: index > 2 ? NOW : null,
      withdrawFinishedAt: index > 2 ? NOW : null,
      withdrawRowCount: index > 2 ? 25 : null,
      withdrawMatchedCount: index > 2 ? 20 : null,
      withdrawUnmatchedCount: index > 2 ? 5 : null,
      orderCount: 15 + index,
      itemCount: 30 + index * 2,
      createdAt: NOW,
      updatedAt: NOW,
    }
  })
}

function buildConnections(storeId: number, marketplaceCode: string): MarketplaceConnection[] {
  if (storeId <= 0) {
    return []
  }

  return [
    {
      marketplaceCode: marketplaceCode as MarketplaceConnection["marketplaceCode"],
      localConnectionId: storeId,
      externalConnectionId: `ext-conn-${storeId}-${marketplaceCode}`,
      storeId,
      sellerId: `seller-${storeId}`,
      displayName: `Mock ${marketplaceCode} Shop`,
      country: storeId === 3 ? "TH" : "US",
      account: `account-${storeId}`,
      shortCode: `S${storeId}`,
      tokenExpiresAt: "2025-12-31T00:00:00Z",
      refreshExpiresAt: "2026-06-30T00:00:00Z",
      status: "CONNECTED",
      createdAt: NOW,
    },
  ]
}

interface MockState {
  stores: Store[]
  customers: Customer[]
  users: AdminUser[]
  products: MarketplaceProduct[]
  productSources: MarketplaceProductSource[]
  importFiles: ApiOrderImportFileDto[]
  inputRuns: ApiOrderInputRunDto[]
  syncRuns: MarketplaceProductSyncRun[]
  nextCustomerId: number
  nextUserId: number
  nextStoreId: number
  nextInputRunId: number
}

function createInitialState(): MockState {
  const stores = buildStores()
  const products = buildProducts()

  return {
    stores,
    customers: buildCustomers(),
    users: buildUsers(),
    products,
    productSources: buildProductSources(),
    importFiles: buildImportFiles(),
    inputRuns: buildInputRuns(),
    syncRuns: [],
    nextCustomerId: 100,
    nextUserId: 100,
    nextStoreId: stores.length + 1,
    nextInputRunId: 100,
  }
}

let state = createInitialState()

export function getMockState(): MockState {
  return state
}

export function resetMockState(): void {
  state = createInitialState()
}

export function getStoreById(id: number): Store | undefined {
  return state.stores.find((s) => s.id === id)
}

export function getCustomerById(id: number): Customer | undefined {
  return state.customers.find((c) => c.id === id)
}

export function getUserById(id: number): AdminUser | undefined {
  return state.users.find((u) => u.id === id)
}

export function getProductById(id: number): MarketplaceProduct | undefined {
  return state.products.find((p) => p.id === id)
}

export function getProductDetailById(id: number): MarketplaceProductDetail | null {
  const product = getProductById(id)
  return product ? buildProductDetail(product) : null
}

export function getImportFileById(id: number): ApiOrderImportFileDto | undefined {
  return state.importFiles.find((f) => f.id === id)
}

export function getInputRunById(id: number): ApiOrderInputRunDto | undefined {
  return state.inputRuns.find((r) => r.id === id)
}

export function getConnections(storeId: number, marketplaceCode: string): MarketplaceConnection[] {
  return buildConnections(storeId, marketplaceCode)
}

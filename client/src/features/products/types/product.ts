import type { MarketplaceCode } from "@/features/stores/config/marketplaces"

export type ProductErpStatus = "synced" | "unmapped"

export type ProductErpFilter = "all" | ProductErpStatus

export type MarketplaceProductSyncStatus = "RUNNING" | "COMPLETED" | "FAILED"

export interface MarketplaceProductSource {
  storeId: number
  storeName: string
  marketplaceCode: MarketplaceCode
  marketplaceName: string
  externalConnectionId: string
  label: string
  country: string | null
  lastSyncedAt: string | null
  syncStatus: MarketplaceProductSyncStatus | null
}

export interface MarketplaceProduct {
  id: number
  storeId: number
  storeName: string
  marketplaceCode: MarketplaceCode
  marketplaceName: string
  externalProductId: string
  sku: string
  name: string
  price: string
  currency: string
  status: string
  erpStatus: ProductErpStatus
}

export type ProductTableRow = MarketplaceProduct

export interface MarketplaceProductVariant {
  sku: string
  price: string
  currency: string
  status: string
  quantity: string
}

export interface MarketplaceProductErpDetail {
  status: string
  localProductId: number | null
  erpItemId: number | null
  erpSku: string | null
  erpName: string | null
  mappedAt: string | null
}

export interface MarketplaceProductDetail {
  id: number
  storeId: number
  storeName: string
  marketplaceCode: MarketplaceCode
  marketplaceName: string
  externalProductId: string
  sku: string
  name: string
  description: string | null
  price: string
  currency: string
  status: string
  images: string[]
  variants: MarketplaceProductVariant[]
  erp: MarketplaceProductErpDetail
}

export interface MarketplaceProductSyncRun {
  id: number
  storeId: number
  marketplaceCode: MarketplaceCode
  status: MarketplaceProductSyncStatus
  insertedCount: number
  updatedCount: number
  disabledCount: number
  failedCount: number
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
}

export interface ProductStats {
  mappingRatePercent: number
  actionRequiredCount: number
  activeSkuCount: number
}

export interface MarketplaceProductStats {
  connectedSources: number
  visibleProducts: number
  totalProducts: number
}

export type ProductPriceSort = "none" | "asc" | "desc"

export interface ProductFiltersState {
  sourceKey: string
  search: string
  erpStatus: ProductErpFilter
  priceMin: string
  priceMax: string
  priceSort: ProductPriceSort
}

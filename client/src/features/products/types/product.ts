import type { MarketplaceCode } from "@/features/stores/config/marketplaces"

export type ProductErpStatus = "synced" | "unmapped"

export type ProductErpFilter = "all" | ProductErpStatus

export interface MarketplaceProductSource {
  storeId: number
  storeName: string
  marketplaceCode: MarketplaceCode
  marketplaceName: string
  externalConnectionId: string
  label: string
  country: string | null
}

export interface MarketplaceProduct {
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
}

export interface ProductTableRow extends MarketplaceProduct {
  erpStatus: ProductErpStatus
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

export interface ProductFiltersState {
  sourceKey: string
  erpStatus: ProductErpFilter
  priceMin: string
  priceMax: string
}

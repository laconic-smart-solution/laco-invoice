export type ProductErpStatus = "synced" | "unmapped"

export type ProductErpFilter = "all" | ProductErpStatus

export interface Product {
  id: string
  storeId: string
  marketplaceId: string
  productId: string
  sku: string
  name: string
  price: number
  erpStatus: ProductErpStatus
}

export interface ProductStats {
  mappingRatePercent: number
  actionRequiredCount: number
  activeSkuCount: number
}

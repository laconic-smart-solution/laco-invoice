import type { MarketplaceProduct, ProductErpStatus } from "@/features/products/types/product"

/**
 * Placeholder ERP mapping status until ERP API integration is added.
 * Deterministic per product so the UI stays stable across re-renders.
 */
export function derivePlaceholderErpStatus(product: MarketplaceProduct): ProductErpStatus {
  const key = `${product.externalProductId}:${product.sku}`
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash + key.charCodeAt(index)) % 100
  }
  return hash > 55 ? "synced" : "unmapped"
}

export const ERP_STATUS_FILTER_OPTIONS = [
  { value: "all", labelKey: "filters.erp_status.all" },
  { value: "synced", labelKey: "filters.erp_status.synced" },
  { value: "unmapped", labelKey: "filters.erp_status.unmapped" },
] as const

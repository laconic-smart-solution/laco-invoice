import type { Product, ProductErpFilter, ProductStats } from "@/features/products/types/product"

export const MOCK_PRODUCTS_TOTAL = 128

export const MOCK_PRODUCT_STATS: ProductStats = {
  mappingRatePercent: 84.2,
  actionRequiredCount: 22,
  activeSkuCount: 1024,
}

export const MARKETPLACE_SOURCE_OPTIONS = [
  { value: "tiktok_fashion_hh", labelKey: "filters.marketplace.tiktok_fashion_hh" },
  { value: "tiktok_beauty_us", labelKey: "filters.marketplace.tiktok_beauty_us" },
  { value: "shopify_main", labelKey: "filters.marketplace.shopify_main" },
] as const

export const ERP_STATUS_FILTER_OPTIONS: { value: ProductErpFilter; labelKey: string }[] = [
  { value: "all", labelKey: "filters.erp_status.all" },
  { value: "synced", labelKey: "filters.erp_status.synced" },
  { value: "unmapped", labelKey: "filters.erp_status.unmapped" },
]

const PRODUCT_TEMPLATES = [
  {
    name: "CloudWalk Pro V2",
    productId: "88291022",
    sku: "TTS-CWV2-001-WHT",
    price: 124.99,
    erpStatus: "synced" as const,
  },
  {
    name: "Urban Flex Hoodie",
    productId: "88291023",
    sku: "TTS-UFH-002-BLK",
    price: 59.99,
    erpStatus: "unmapped" as const,
  },
  {
    name: "SilkBlend Summer Dress",
    productId: "88291024",
    sku: "TTS-SBS-003-CRM",
    price: 89.5,
    erpStatus: "synced" as const,
  },
  {
    name: "AeroFit Running Shorts",
    productId: "88291025",
    sku: "TTS-AFR-004-NVY",
    price: 44.99,
    erpStatus: "unmapped" as const,
  },
  {
    name: "Luxe Leather Tote",
    productId: "88291026",
    sku: "TTS-LLT-005-TAN",
    price: 199.0,
    erpStatus: "synced" as const,
  },
  {
    name: "Minimalist Watch Band",
    productId: "88291027",
    sku: "TTS-MWB-006-GRY",
    price: 29.99,
    erpStatus: "synced" as const,
  },
  {
    name: "PeakTrail Hiking Boots",
    productId: "88291028",
    sku: "TTS-PTH-007-BRN",
    price: 149.99,
    erpStatus: "unmapped" as const,
  },
  {
    name: "Studio Pro Headphones",
    productId: "88291029",
    sku: "TTS-SPH-008-BLK",
    price: 79.99,
    erpStatus: "synced" as const,
  },
] as const

function buildMockProduct(globalIndex: number): Product {
  const template = PRODUCT_TEMPLATES[globalIndex % PRODUCT_TEMPLATES.length]
  const storeNum = String((globalIndex % 5) + 1).padStart(3, "0")

  return {
    id: String(globalIndex + 1),
    storeId: `#STR-${storeNum}`,
    marketplaceId: "#MKT-TTS-01",
    productId: String(Number.parseInt(template.productId, 10) + globalIndex),
    sku: template.sku,
    name: template.name,
    price: template.price,
    erpStatus: template.erpStatus,
  }
}

export function getMockProductsPage(page: number, limit: number): Product[] {
  const offset = (page - 1) * limit
  const count = Math.min(limit, Math.max(MOCK_PRODUCTS_TOTAL - offset, 0))

  return Array.from({ length: count }, (_, index) => buildMockProduct(offset + index))
}

export type MarketplaceCode = "LAZADA" | "SHOPEE" | "TIKTOK"

export interface MarketplaceConfig {
  code: MarketplaceCode
  routeSegment: string
  connectEnabled: boolean
  callbackPath: string
}

export const SUPPORTED_MARKETPLACES: MarketplaceConfig[] = [
  {
    code: "LAZADA",
    routeSegment: "lazada",
    connectEnabled: true,
    callbackPath: "/stores/lazada/callback",
  },
  {
    code: "SHOPEE",
    routeSegment: "shopee",
    connectEnabled: true,
    callbackPath: "/stores/shopee/callback",
  },
  {
    code: "TIKTOK",
    routeSegment: "tiktok",
    connectEnabled: true,
    callbackPath: "/stores/tiktok/callback",
  },
]

export function getMarketplaceConfig(code: MarketplaceCode): MarketplaceConfig {
  const config = SUPPORTED_MARKETPLACES.find((item) => item.code === code)
  if (!config) {
    throw new Error(`Unsupported marketplace: ${code}`)
  }
  return config
}

export function getMarketplaceByRouteSegment(segment: string): MarketplaceConfig | undefined {
  const normalized = segment.trim().toLowerCase()
  return SUPPORTED_MARKETPLACES.find((item) => item.routeSegment === normalized)
}

export function getEnabledMarketplaces(): MarketplaceConfig[] {
  return SUPPORTED_MARKETPLACES.filter((item) => item.connectEnabled)
}

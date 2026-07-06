export interface Store {
  id: number
  ownerId: number | null
  name: string
  logoUrl: string | null
  active: boolean
  createdAt: string
}

export interface StoreCreateInput {
  name: string
  logoUrl?: string
  active?: boolean
}

export interface StorePageRequest {
  pageNumber: number
  pageSize: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    name?: string
    active?: boolean
    ownerId?: number
  }
}

export type MarketplaceCode = "LAZADA" | "SHOPEE" | "TIKTOK"

export interface Marketplace {
  id: number
  code: MarketplaceCode
  name: string
}

export type MarketplaceConnectionStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "EXPIRED"
  | "PENDING"

export interface StoreMarketplaceConnection {
  id: number
  storeId: number
  marketplaceId: number
  marketplaceCode: string
  marketplaceName: string
  externalConnectionId: string | null
  externalSellerId: string | null
  externalCountry: string | null
  displayName: string | null
  tokenExpiry: string | null
  status: MarketplaceConnectionStatus
  createdAt: string
  updatedAt: string
}

export interface MarketplaceAuthorizeUrl {
  url: string
  state: string
}

export interface MarketplaceConnection {
  marketplaceCode: MarketplaceCode
  localConnectionId: number | null
  externalConnectionId: string
  storeId: number
  sellerId: string
  displayName: string | null
  country: string | null
  account: string | null
  shortCode: string | null
  tokenExpiresAt: string | null
  refreshExpiresAt: string | null
  status: MarketplaceConnectionStatus
  createdAt: string
}

export interface MarketplaceConnectInput {
  code: string
  displayName?: string
  shopId?: string
}

/** @deprecated Use MarketplaceAuthorizeUrl */
export type LazadaAuthorizeUrl = MarketplaceAuthorizeUrl

/** @deprecated Use MarketplaceConnection */
export type LazadaConnection = MarketplaceConnection

/** @deprecated Use MarketplaceConnectInput */
export type LazadaConnectInput = MarketplaceConnectInput

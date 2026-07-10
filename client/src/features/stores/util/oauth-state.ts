import type { MarketplaceCode } from "@/features/stores/config/marketplaces"

export interface OAuthStatePayload {
  storeId: number
  marketplace?: MarketplaceCode
}

export function parseOAuthState(state: string): OAuthStatePayload {
  const normalized = state.trim().replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=")
  const decoded = atob(padded)
  const parsed = JSON.parse(decoded) as OAuthStatePayload
  if (typeof parsed.storeId !== "number" || parsed.storeId <= 0) {
    throw new Error("Invalid OAuth state")
  }
  return parsed
}

export function parseStoreIdFromOAuthState(state: string): number {
  return parseOAuthState(state).storeId
}

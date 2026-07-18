import type { MarketplaceCode } from "@/features/stores/config/marketplaces"
import type {
  MarketplaceProduct,
  MarketplaceProductDetail,
  MarketplaceProductSource,
  MarketplaceProductSyncRun,
} from "@/features/products/types/product"
import { normalizeProductErpStatus } from "@/features/products/util/erp-status"
import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"

export interface MarketplaceProductListParams {
  storeId: number
  marketplaceCode: MarketplaceCode
  page?: number
  limit?: number
  search?: string
  priceMin?: number
  priceMax?: number
}

export interface MarketplaceProductSyncParams {
  storeId: number
  marketplaceCode: MarketplaceCode
}

export const marketplaceProductService = {
  listSources: async () => {
    const response = await apiClient.get<ApiResponse<MarketplaceProductSource[]>>(
      "/v1/marketplace-products/sources"
    )
    return response.data.data ?? []
  },

  listProducts: async (params: MarketplaceProductListParams) => {
    const response = await apiClient.get<
      ApiResponse<Array<Omit<MarketplaceProduct, "erpStatus"> & { erpStatus?: string }>>
    >("/v1/marketplace-products", {
      params: {
        storeId: params.storeId,
        marketplaceCode: params.marketplaceCode,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search?.trim() || undefined,
        priceMin: params.priceMin,
        priceMax: params.priceMax,
      },
    })
    return {
      items: (response.data.data ?? []).map((product) => ({
        ...product,
        erpStatus: normalizeProductErpStatus(product.erpStatus),
      })),
      total: response.data.meta?.totalElements ?? 0,
    }
  },

  getDetail: async (productId: number) => {
    const response = await apiClient.get<ApiResponse<MarketplaceProductDetail>>(
      `/v1/marketplace-products/${productId}`
    )
    return response.data.data
  },

  startSync: async (params: MarketplaceProductSyncParams) => {
    const response = await apiClient.post<ApiResponse<MarketplaceProductSyncRun>>(
      "/v1/marketplace-products/sync",
      null,
      {
        params: {
          storeId: params.storeId,
          marketplaceCode: params.marketplaceCode,
        },
      }
    )
    return response.data.data
  },

  getSyncStatus: async (syncRunId: number) => {
    const response = await apiClient.get<ApiResponse<MarketplaceProductSyncRun>>(
      `/v1/marketplace-products/sync/${syncRunId}`
    )
    return response.data.data
  },
}

export function buildProductSourceKey(storeId: number, marketplaceCode: string): string {
  return `${storeId}:${marketplaceCode}`
}

export function parseProductSourceKey(
  sourceKey: string
): { storeId: number; marketplaceCode: MarketplaceCode } | null {
  const separatorIndex = sourceKey.indexOf(":")
  if (separatorIndex <= 0) {
    return null
  }
  const storeId = Number.parseInt(sourceKey.slice(0, separatorIndex), 10)
  const marketplaceCode = sourceKey.slice(separatorIndex + 1).toUpperCase() as MarketplaceCode
  if (!Number.isFinite(storeId) || storeId <= 0 || !marketplaceCode) {
    return null
  }
  return { storeId, marketplaceCode }
}

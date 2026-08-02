import type { MarketplaceCode } from "@/features/stores/config/marketplaces"
import type {
  MarketplaceProduct,
  MarketplaceProductDetail,
  MarketplaceProductSource,
  MarketplaceProductSyncRun,
  ProductStats,
} from "@/features/products/types/product"
import { normalizeProductErpStatus } from "@/features/products/util/erp-status"
import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"
import { downloadBlob, filenameFromContentDisposition, rethrowBlobApiError } from "@/util/download-blob"

export interface MarketplaceProductListParams {
  storeId: number
  marketplaceCode: MarketplaceCode
  page?: number
  limit?: number
  search?: string
  priceMin?: number
  priceMax?: number
}

export interface MarketplaceProductPageRequest {
  pageNumber: number
  pageSize: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    storeId?: number
    marketplaceCode?: string
    search?: string
    priceMin?: number
    priceMax?: number
    erpStatus?: string
  }
}

export interface MarketplaceProductExportRequest {
  ids?: number[]
  exportAll?: boolean
  filter?: MarketplaceProductPageRequest["filter"]
  columns?: string[]
  pageNumber?: number
  pageSize?: number
}

export interface MarketplaceProductSyncParams {
  storeId: number
  marketplaceCode: MarketplaceCode
}

export interface MarketplaceProductStatsParams {
  storeId?: number
  marketplaceCode?: string
}

interface ApiMarketplaceProductStatsDto {
  totalCount: number
  syncedCount: number
  unmappedCount: number
  mappingRatePercent: number
}

function mapProducts(
  products: Array<Omit<MarketplaceProduct, "erpStatus"> & { erpStatus?: string }>
): MarketplaceProduct[] {
  return products.map((product) => ({
    ...product,
    erpStatus: normalizeProductErpStatus(product.erpStatus),
  }))
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
      items: mapProducts(response.data.data ?? []),
      total: response.data.meta?.totalElements ?? 0,
    }
  },

  pageProducts: async (request: MarketplaceProductPageRequest) => {
    const response = await apiClient.post<
      ApiResponse<Array<Omit<MarketplaceProduct, "erpStatus"> & { erpStatus?: string }>>
    >("/v1/marketplace-products/pageable", request)
    return {
      ...response.data,
      data: mapProducts(response.data.data ?? []),
    }
  },

  previewExport: async (request: MarketplaceProductExportRequest) => {
    const response = await apiClient.post<
      ApiResponse<Array<Omit<MarketplaceProduct, "erpStatus"> & { erpStatus?: string }>>
    >("/v1/marketplace-products/export/preview", {
      ...request,
      pageNumber: request.pageNumber ?? 1,
      pageSize: request.pageSize ?? 10,
    })
    return {
      ...response.data,
      data: mapProducts(response.data.data ?? []),
    }
  },

  exportExcel: async (request: MarketplaceProductExportRequest) => {
    try {
      const response = await apiClient.post<Blob>(
        "/v1/marketplace-products/export",
        request,
        { responseType: "blob" }
      )
      const filename = filenameFromContentDisposition(
        response.headers["content-disposition"] as string | undefined,
        "products-export.xlsx"
      )
      downloadBlob(response.data, filename)
    } catch (error) {
      await rethrowBlobApiError(error)
    }
  },

  getStats: async (params: MarketplaceProductStatsParams = {}): Promise<ProductStats> => {
    const response = await apiClient.get<ApiResponse<ApiMarketplaceProductStatsDto>>(
      "/v1/marketplace-products/stats",
      {
        params: {
          storeId: params.storeId,
          marketplaceCode: params.marketplaceCode,
        },
      }
    )
    const data = response.data.data
    return {
      mappingRatePercent: data?.mappingRatePercent ?? 0,
      actionRequiredCount: data?.unmappedCount ?? 0,
      activeSkuCount: data?.syncedCount ?? 0,
      totalCount: data?.totalCount ?? 0,
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

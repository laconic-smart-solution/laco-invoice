import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"

export type ApiOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"

export interface ApiOrderDto {
  id: number
  storeId: number
  storeName: string | null
  marketplaceId: number
  marketplaceCode: string
  customerId: number | null
  customerName: string | null
  externalOrderId: string
  orderStatus: ApiOrderStatus
  subtotal: number
  shippingFee: number
  totalAmount: number
  currency: string | null
  orderDate: string | null
  createdAt: string
}

export interface ApiCustomerInfoDto {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  gender: string | null
  address: string | null
}

export interface ApiOrderItemDto {
  id: number
  productId: number | null
  sku: string | null
  productName: string | null
  price: number
  quantity: number
  lineTotal: number
}

export interface ApiOrderDetailDto {
  order: ApiOrderDto
  customer: ApiCustomerInfoDto | null
  items: ApiOrderItemDto[]
}

export interface OrderPageRequest {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    orderStatus?: ApiOrderStatus
    externalOrderId?: string
    storeId?: number
    marketplaceId?: number
    marketplaceCode?: string
  }
}

export const orderService = {
  pageOrders: async (request: OrderPageRequest) => {
    const response = await apiClient.post<ApiResponse<ApiOrderDto[]>>(
      "/v1/orders/pageable",
      request
    )
    return response.data
  },

  getOrder: async (id: number) => {
    const response = await apiClient.get<ApiResponse<ApiOrderDetailDto>>(
      `/v1/orders/${id}`
    )
    return response.data.data
  },

  triggerSync: async () => {
    await apiClient.post("/v1/orders/sync")
  },
}

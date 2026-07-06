import { apiClient } from "@/app/api/client"
import type {
  Customer,
  CustomerCreateInput,
  CustomerPageRequest,
  CustomerUpdateInput,
} from "@/features/customers/types/customer"
import type { ApiResponse } from "@/shared/types/api-response"

function normalizeOptional(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizePayload<T extends CustomerCreateInput>(payload: T): T {
  return {
    ...payload,
    name: payload.name.trim(),
    email: normalizeOptional(payload.email),
    phone: normalizeOptional(payload.phone),
    gender: normalizeOptional(payload.gender),
    address: normalizeOptional(payload.address),
  }
}

export const customerService = {
  pageCustomers: async (request: CustomerPageRequest) => {
    const response = await apiClient.post<ApiResponse<Customer[]>>(
      "/v1/customers/pageable",
      request
    )
    return response.data
  },

  getCustomer: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Customer>>(`/v1/customers/${id}`)
    return response.data.data
  },

  createCustomer: async (payload: CustomerCreateInput) => {
    const response = await apiClient.post<ApiResponse<Customer>>(
      "/v1/customers",
      normalizePayload(payload)
    )
    return response.data.data
  },

  updateCustomer: async (id: number, payload: CustomerUpdateInput) => {
    const response = await apiClient.put<ApiResponse<Customer>>(
      `/v1/customers/${id}`,
      normalizePayload(payload)
    )
    return response.data.data
  },

  deleteCustomer: async (id: number) => {
    await apiClient.delete(`/v1/customers/${id}`)
  },
}

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  CustomerCreateInput,
  CustomerPageRequest,
  CustomerUpdateInput,
} from "@/features/customers/types/customer"
import {
  customerService,
  type CustomerExportRequest,
} from "@/shared/services/customer.service"
import {
  extractApiErrorMessage,
  isAxiosStatusMessage,
} from "@/shared/api/extract-api-error-message"

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (request: CustomerPageRequest) =>
    [...customerKeys.lists(), request] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: number) => [...customerKeys.details(), id] as const,
  exportPreview: (
    request: Omit<CustomerExportRequest, "pageNumber" | "pageSize" | "columns">
  ) => [...customerKeys.all, "export-preview", request] as const,
}

export function useCustomersPageQuery(request: CustomerPageRequest) {
  return useQuery({
    queryKey: customerKeys.list(request),
    queryFn: () => customerService.pageCustomers(request),
  })
}

export function useCustomerQuery(id: number | null) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? 0),
    queryFn: () => customerService.getCustomer(id as number),
    enabled: id != null && id > 0,
  })
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CustomerCreateInput) =>
      customerService.createCustomer(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: CustomerUpdateInput
    }) => customerService.updateCustomer(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => customerService.deleteCustomer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

export function useCustomerExportPreviewQuery(
  request: Omit<CustomerExportRequest, "pageNumber" | "pageSize" | "columns">,
  enabled: boolean
) {
  return useInfiniteQuery({
    queryKey: customerKeys.exportPreview(request),
    queryFn: ({ pageParam }) =>
      customerService.previewExport({
        ...request,
        pageNumber: pageParam,
        pageSize: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.meta?.page ?? 1
      const totalPages = lastPage.meta?.totalPages ?? 0
      if (page >= totalPages) {
        return undefined
      }
      return page + 1
    },
    enabled,
  })
}

export function useExportCustomersMutation() {
  return useMutation({
    mutationFn: (request: CustomerExportRequest) =>
      customerService.exportExcel(request),
  })
}

export function getCustomerErrorMessage(error: unknown, fallback: string): string {
  const message = extractApiErrorMessage(error, fallback)
  if (message === fallback || isAxiosStatusMessage(message)) {
    return fallback
  }
  return message
}

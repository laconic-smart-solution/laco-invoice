import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  extractApiErrorMessage,
  isAxiosStatusMessage,
} from "@/shared/api/extract-api-error-message"
import { orderKeys } from "@/shared/queries/order.query"
import type { ApiOrderImportResultDto } from "@/shared/services/order.service"
import {
  orderInputRunService,
  type ApiOrderInputRunDto,
  type OrderInputRunCreateRequest,
  type OrderInputRunPageRequest,
} from "@/shared/services/order-input-run.service"

export const orderInputRunKeys = {
  all: ["order-input-runs"] as const,
  lists: () => [...orderInputRunKeys.all, "list"] as const,
  list: (request: OrderInputRunPageRequest) =>
    [...orderInputRunKeys.lists(), request] as const,
  details: () => [...orderInputRunKeys.all, "detail"] as const,
  detail: (id: number) => [...orderInputRunKeys.details(), id] as const,
  withdrawRows: (
    id: number,
    pageNumber: number,
    pageSize: number,
    filter?: {
      externalOrderId?: string
      matchStatus?: string
      applyStatus?: string
      sortBy?: string
      sortOrder?: "ASC" | "DESC"
    }
  ) =>
    [
      ...orderInputRunKeys.detail(id),
      "withdraw-rows",
      pageNumber,
      pageSize,
      filter ?? null,
    ] as const,
}

export function useOrderInputRunsPageQuery(request: OrderInputRunPageRequest) {
  return useQuery({
    queryKey: orderInputRunKeys.list(request),
    queryFn: () => orderInputRunService.page(request),
  })
}

export function useOrderInputRunDetailQuery(id: number | null) {
  return useQuery({
    queryKey: orderInputRunKeys.detail(id ?? 0),
    queryFn: () => orderInputRunService.getById(id as number),
    enabled: id != null && id > 0,
  })
}

export function useOrderInputRunWithdrawRowsQuery(
  id: number | null,
  pageNumber: number,
  pageSize: number,
  filter?: {
    externalOrderId?: string
    matchStatus?: string
    applyStatus?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
  },
  enabled = true
) {
  return useQuery({
    queryKey: orderInputRunKeys.withdrawRows(
      id ?? 0,
      pageNumber,
      pageSize,
      filter
    ),
    queryFn: () =>
      orderInputRunService.pageWithdrawRows(
        id as number,
        pageNumber,
        pageSize,
        filter
      ),
    enabled: enabled && id != null && id > 0,
  })
}

export function useUpdateOrderInputRunTitleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      orderInputRunService.updateTitle(id, title),
    onSuccess: (data) => {
      queryClient.setQueryData(orderInputRunKeys.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
    },
  })
}

export function useCreateOrderInputRunMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: OrderInputRunCreateRequest) =>
      orderInputRunService.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
    },
  })
}

export function useUploadOrderInputOrderDetailMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      orderInputRunService.uploadOrderDetail(id, file),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: orderInputRunKeys.detail(data.id),
      })
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
    },
  })
}

export function useUploadOrderInputWithdrawMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      orderInputRunService.uploadWithdraw(id, file),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: orderInputRunKeys.detail(data.id),
      })
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
    },
  })
}

export function useStartOrderInputRunPreviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderInputRunService.startRunPreview(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: orderInputRunKeys.detail(id) })
      const previous = queryClient.getQueryData<ApiOrderInputRunDto>(
        orderInputRunKeys.detail(id)
      )
      if (previous) {
        queryClient.setQueryData(orderInputRunKeys.detail(id), {
          ...previous,
          status: "RUNNING",
          orderDetailStatus: "RUNNING",
        })
      }
      return { previous }
    },
    onError: (_error, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(orderInputRunKeys.detail(id), context.previous)
      }
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: orderInputRunKeys.detail(id),
      })
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
    },
  })
}

export function useCancelOrderInputRunPreviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderInputRunService.cancelRunPreview(id),
    onSuccess: (data) => {
      queryClient.setQueryData(orderInputRunKeys.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
    },
  })
}

export function useResetStuckOrderInputRunMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderInputRunService.resetStuck(id),
    onSuccess: (data) => {
      queryClient.setQueryData(orderInputRunKeys.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
    },
  })
}

export function useFinishOrderInputRunMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      importResult,
    }: {
      id: number
      importResult: ApiOrderImportResultDto
    }) => orderInputRunService.finishRun(id, importResult),
    onSuccess: (data) => {
      queryClient.setQueryData(orderInputRunKeys.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

export function useRunOrderInputWithdrawMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderInputRunService.runWithdraw(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: orderInputRunKeys.detail(id) })
      const previous = queryClient.getQueryData<ApiOrderInputRunDto>(
        orderInputRunKeys.detail(id)
      )
      if (previous) {
        queryClient.setQueryData(orderInputRunKeys.detail(id), {
          ...previous,
          status: "RUNNING",
          withdrawStatus: "RUNNING",
        })
      }
      return { previous }
    },
    onError: (_error, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(orderInputRunKeys.detail(id), context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(orderInputRunKeys.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: [...orderInputRunKeys.detail(data.id), "withdraw-rows"],
      })
    },
  })
}

export function useDeleteOrderInputRunMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderInputRunService.deleteSet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orderInputRunKeys.all,
      })
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      })
      queryClient.invalidateQueries({
        queryKey: ["invoices"],
      })
      queryClient.invalidateQueries({
        queryKey: ["customers"],
      })
      queryClient.invalidateQueries({
        queryKey: ["products"],
      })
    },
  })
}

export function useRollbackOrderInputOrderDetailMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderInputRunService.rollbackOrderDetail(id),
    onSuccess: (data) => {
      queryClient.setQueryData(orderInputRunKeys.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}

export function useRollbackOrderInputWithdrawMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderInputRunService.rollbackWithdraw(id),
    onSuccess: (data) => {
      queryClient.setQueryData(orderInputRunKeys.detail(data.id), data)
      void queryClient.invalidateQueries({ queryKey: orderInputRunKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: [...orderInputRunKeys.detail(data.id), "withdraw-rows"],
      })
      void queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}

export function getOrderInputRunErrorMessage(
  error: unknown,
  fallback: string
): string {
  const message = extractApiErrorMessage(error, fallback)
  if (message === fallback || isAxiosStatusMessage(message)) {
    return fallback
  }
  return message
}


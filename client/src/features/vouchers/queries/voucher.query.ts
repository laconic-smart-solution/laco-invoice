import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  GenerateVoucherRequest,
  VoucherPageRequest,
} from "@/features/vouchers/types/voucher"
import { voucherService } from "@/shared/services/voucher.service"

export const voucherKeys = {
  all: ["vouchers"] as const,
  lists: () => [...voucherKeys.all, "list"] as const,
  list: (request: VoucherPageRequest) =>
    [...voucherKeys.lists(), request] as const,
  details: () => [...voucherKeys.all, "detail"] as const,
  detail: (id: number) => [...voucherKeys.details(), id] as const,
}

const LIST_PAGE_REQUEST: VoucherPageRequest = {
  pageNumber: 1,
  pageSize: 200,
  sortBy: "createdAt",
  sortOrder: "DESC",
}

export function useVouchersQuery(request: VoucherPageRequest = LIST_PAGE_REQUEST) {
  return useQuery({
    queryKey: voucherKeys.list(request),
    queryFn: async () => (await voucherService.page(request)).data ?? [],
    staleTime: 30_000,
  })
}

export function useVoucherDetailQuery(id: number | null) {
  return useQuery({
    queryKey: voucherKeys.detail(id ?? 0),
    queryFn: () => voucherService.getById(id as number),
    enabled: id != null && id > 0,
  })
}

export function useGenerateVoucherMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: GenerateVoucherRequest) =>
      voucherService.generate(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voucherKeys.all })
    },
  })
}

export function useUpdateVoucherMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number
      request: GenerateVoucherRequest
    }) => voucherService.update(id, request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: voucherKeys.all })
      void queryClient.invalidateQueries({
        queryKey: voucherKeys.detail(variables.id),
      })
    },
  })
}

export function usePostVoucherToErpMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => voucherService.postToErp(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: voucherKeys.all })
      void queryClient.invalidateQueries({ queryKey: voucherKeys.detail(id) })
    },
  })
}

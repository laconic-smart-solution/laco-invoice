import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { UserPageRequest } from "@/features/users/types/user"
import {
  adminUserService,
  type AdminUserCreateInput,
} from "@/shared/services/admin-user.service"
import {
  extractApiErrorMessage,
  isAxiosStatusMessage,
} from "@/shared/api/extract-api-error-message"

export const adminUserKeys = {
  all: ["admin-users"] as const,
  lists: () => [...adminUserKeys.all, "list"] as const,
  list: (request: UserPageRequest) => [...adminUserKeys.lists(), request] as const,
}

export function useUsersPageQuery(request: UserPageRequest) {
  return useQuery({
    queryKey: adminUserKeys.list(request),
    queryFn: () => adminUserService.pageUsers(request),
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AdminUserCreateInput) => adminUserService.createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() })
    },
  })
}

export function useVerifyUserOtpMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => adminUserService.verifyOtp(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() })
    },
  })
}

export function getAdminUserErrorMessage(error: unknown, fallback: string): string {
  const message = extractApiErrorMessage(error, fallback)
  if (message === fallback || isAxiosStatusMessage(message)) {
    return fallback
  }
  return message
}

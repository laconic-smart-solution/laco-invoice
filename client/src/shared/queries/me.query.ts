import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  extractApiErrorMessage,
  isAxiosStatusMessage,
} from "@/shared/api/extract-api-error-message"
import { meService } from "@/shared/services/me.service"
import { useAuthStore } from "@/shared/stores/auth-store"
import type { MeCredentialsRequest } from "@/shared/types/auth.types"

export const meKeys = {
  all: ["me"] as const,
  profile: () => [...meKeys.all, "profile"] as const,
}

export function useMeProfileQuery(enabled = true) {
  return useQuery({
    queryKey: meKeys.profile(),
    queryFn: () => meService.getProfile(),
    enabled,
    staleTime: 60_000,
  })
}

export function useChangeCredentialsMutation() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: (payload: MeCredentialsRequest) => meService.changeCredentials(payload),
    onSuccess: (profile) => {
      setUser(profile)
      queryClient.setQueryData(meKeys.profile(), profile)
      void queryClient.invalidateQueries({ queryKey: meKeys.profile() })
    },
  })
}

export function getMeErrorMessage(error: unknown, fallback: string): string {
  const message = extractApiErrorMessage(error, fallback)
  if (message === fallback || isAxiosStatusMessage(message)) {
    return fallback
  }
  return message
}

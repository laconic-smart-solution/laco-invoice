import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios"

import { useAuthStore } from "@/shared/stores/auth-store"

interface Attach401RefreshOptions {
  loginPath?: string
}

type RetriableConfig = InternalAxiosRequestConfig & {
  _retryAfterRefresh?: boolean
}

let refreshInFlight: Promise<boolean> | null = null

function isAuthBypassPath(config: InternalAxiosRequestConfig | undefined): boolean {
  const url = config?.url ?? ""
  return (
    url.includes("/v1/auth/login") ||
    url.includes("/v1/auth/refresh") ||
    url.includes("/v1/auth/logout") ||
    url.includes("/v1/auth/resend-otp") ||
    url.includes("/v1/auth/verify-otp") ||
    url.includes("/v1/auth/change-password")
  )
}

async function refreshSessionOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const { authService } = await import("@/shared/services/auth.service")
        await authService.refresh()
        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

async function forceLogoutAndRedirect(loginPath: string): Promise<void> {
  try {
    const { authService } = await import("@/shared/services/auth.service")
    await authService.logout()
  } catch {
    // Best-effort cookie clear when session is already invalid.
  }
  useAuthStore.getState().clearSession()
  window.location.replace(loginPath)
}

export function attach401RefreshInterceptor(
  client: AxiosInstance,
  options?: Attach401RefreshOptions
): void {
  const loginPath = options?.loginPath ?? "/login"

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const status = error.response?.status ?? error.status
      const config = error.config as RetriableConfig | undefined

      if (status !== 401 || !config) {
        return Promise.reject(error)
      }

      if (isAuthBypassPath(config)) {
        return Promise.reject(error)
      }

      if (config._retryAfterRefresh) {
        await forceLogoutAndRedirect(loginPath)
        return Promise.reject(error)
      }

      const refreshed = await refreshSessionOnce()
      if (!refreshed) {
        await forceLogoutAndRedirect(loginPath)
        return Promise.reject(error)
      }

      config._retryAfterRefresh = true
      return client.request(config)
    }
  )
}
